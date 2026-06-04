import { convertLocalToUTC } from './dateTimeUtils';

/** Calendar date (YYYY-MM-DD) → API slot_date param */
export const formatSlotDateForApi = (calendarDate) => {
  if (!calendarDate) return null;
  return `${calendarDate}T00:00:00`;
};

/** API slot_date (20251010, ISO date, etc.) → YYYY-MM-DD */
export const parseApiSlotDate = (slotDate) => {
  if (!slotDate) return null;
  const str = String(slotDate);
  if (str.includes('T')) return str.split('T')[0];
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
};

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
