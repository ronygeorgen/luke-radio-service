import { convertLocalToUTC } from './dateTimeUtils';

/** Calendar date (YYYY-MM-DD) → API slot_date param */
export const formatSlotDateForApi = (calendarDate) => {
  if (!calendarDate) return null;
  return `${calendarDate}T00:00:00`;
};

/**
 * API calendar date without browser-local shift.
 * Handles YYYYMMDD, YYYY-MM-DD, and ISO datetimes with offset (e.g. 2026-06-04T00:00:00+10:00).
 */
export const parseApiCalendarDate = (dateTimeString) => {
  if (!dateTimeString) return null;
  const str = String(dateTimeString).trim();

  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }

  const datePartMatch = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (datePartMatch) {
    return datePartMatch[1];
  }

  const tz = ((typeof localStorage !== 'undefined' && localStorage.getItem('channelTimezone')) || 'UTC').trim();
  try {
    const date = new Date(str);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return null;
  }
};

/** API slot_date (20251010, ISO date, etc.) → YYYY-MM-DD */
export const parseApiSlotDate = (slotDate) => parseApiCalendarDate(slotDate);

export const getCalendarDateFromFilters = (filters) => {
  if (filters?.date) return filters.date;
  if (filters?.startDate) return filters.startDate;
  return new Date().toLocaleDateString('en-CA');
};

export const getDatetimeRangeFromFilters = (filters) => {
  let startDatetime = null;
  let endDatetime = null;

  if (filters?.startDate && filters?.endDate) {
    const startTime = filters.startTime || '00:00:00';
    const endTime = filters.endTime || '23:59:59';
    startDatetime = convertLocalToUTC(filters.startDate, startTime);
    endDatetime = convertLocalToUTC(filters.endDate, endTime);
  } else if (filters?.date) {
    const startTime = filters.startTime || '00:00:00';
    const endTime = filters.endTime || '23:59:59';
    startDatetime = convertLocalToUTC(filters.date, startTime);
    endDatetime = convertLocalToUTC(filters.date, endTime);
  }

  return { startDatetime, endDatetime };
};

export const getStatusParamFromFilters = (filters) => {
  if (filters?.onlyActive === true) return 'active';
  if (filters?.status === 'active' || filters?.status === 'inactive') return filters.status;
  return null;
};

export const getContentTypesFromFilters = (filters) => {
  if (filters?.contentTypes?.length > 0) return [...filters.contentTypes];
  return [];
};

export const buildFetchAudioSegmentsV3Args = (channelId, filters, overrides = {}) => {
  const { startDatetime, endDatetime } = getDatetimeRangeFromFilters(filters);

  const calendarDate =
    overrides.slotCalendarDate ??
    (overrides.slotDate ? parseApiSlotDate(overrides.slotDate) : null) ??
    getCalendarDateFromFilters(filters);

  const slotDate =
    overrides.slotDate !== undefined
      ? overrides.slotDate
      : formatSlotDateForApi(calendarDate);

  // API requires slot_index whenever slot_date is sent
  const slotIndex =
    overrides.slotIndex !== undefined && overrides.slotIndex !== null
      ? overrides.slotIndex
      : filters?.slotIndex !== undefined && filters?.slotIndex !== null
        ? filters.slotIndex
        : 0;

  const args = {
    channelId,
    startDatetime,
    endDatetime,
    slotDate,
    slotIndex,
    shiftId: filters?.shiftId || null,
    predefinedFilterId: filters?.predefinedFilterId || null,
    contentTypes: getContentTypesFromFilters(filters),
    status: getStatusParamFromFilters(filters),
    searchText: filters?.searchText || null,
    searchIn: filters?.searchIn || null,
    showFlaggedOnly: filters?.showFlaggedOnly || false,
    durationSecondsMin: null,
    durationSecondsMax: null,
    sentimentMin: null,
    sentimentMax: null,
    transcribedOnly: null,
    searchType: null,
  };

  const parseOptionalInt = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(String(value), 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  args.durationSecondsMin =
    parseOptionalInt(filters?.durationSecondsMin) ??
    parseOptionalInt(filters?.duration);
  args.durationSecondsMax = parseOptionalInt(filters?.durationSecondsMax);

  const sentimentMin = parseOptionalInt(filters?.sentimentMin);
  const sentimentMax = parseOptionalInt(filters?.sentimentMax);
  if (sentimentMin !== null) args.sentimentMin = sentimentMin;
  if (sentimentMax !== null) args.sentimentMax = sentimentMax;

  return args;
};

export const createV3ParamsSerializer = (params) => {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    if (key === 'content_type' && Array.isArray(params[key])) {
      params[key].forEach((value) => searchParams.append(key, value));
    } else if (params[key] !== null && params[key] !== undefined) {
      searchParams.append(key, params[key]);
    }
  });
  return searchParams.toString();
};

export const computeTotalsFromSegments = (segments) => {
  const list = Array.isArray(segments) ? segments : [];
  const unrecognized = list.filter((s) => !s.is_recognized);
  return {
    total: list.length,
    recognized: list.filter((s) => s.is_recognized).length,
    unrecognized: unrecognized.length,
    unrecognizedWithContent: unrecognized.filter(
      (s) => s.analysis?.summary || s.transcription?.transcript
    ).length,
    unrecognizedWithoutContent: unrecognized.filter(
      (s) => !s.analysis?.summary && !s.transcription?.transcript
    ).length,
    withTranscription: list.filter((s) => s.transcription?.transcript).length,
    withAnalysis: list.filter((s) => s.analysis?.summary).length,
  };
};

export const mapV3ChannelInfo = (segments) => {
  const first = segments?.[0]?.channel;
  if (!first) return null;
  return {
    channel_id: first.id,
    channel_name: first.name,
  };
};
