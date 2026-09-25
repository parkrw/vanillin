/* Inline icons: stroke inherits currentColor. */

const icon = (path, extra = {}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...extra}
  >
    {path}
  </svg>
)

export const KeyIcon = () =>
  icon(<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />)

export const SearchIcon = () =>
  icon(
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  )

export const BellIcon = () =>
  icon(
    <>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </>
  )

export const EllipsisIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </>
  )

export const DiskIcon = () =>
  icon(
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </>
  )

export const UploadIcon = () =>
  icon(
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </>
  )

export const CloseIcon = () =>
  icon(
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  )

export const RefreshIcon = () =>
  icon(
    <>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </>
  )

export const BoxIcon = () =>
  icon(
    <>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>
  )

export const ChevronDownIcon = () => icon(<polyline points="6 9 12 15 18 9" />, { strokeWidth: "2" })
export const ChevronRightIcon = () => icon(<polyline points="9 6 15 12 9 18" />, { strokeWidth: "2" })
export const ChevronUpIcon = () => icon(<polyline points="6 15 12 9 18 15" />, { strokeWidth: "2" })
export const ArrowLeftIcon = () =>
  icon(
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>,
    { strokeWidth: "2" }
  )
export const CartIcon = () =>
  icon(
    <>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </>
  )
export const SiteIcon = () =>
  icon(
    <>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-4h6v4" />
      <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </>
  )
export const PlusIcon = () =>
  icon(
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>,
    { strokeWidth: "2" }
  )
export const ChevronsLeftIcon = () =>
  icon(
    <>
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </>,
    { strokeWidth: "2" }
  )
export const ChevronsRightIcon = () =>
  icon(
    <>
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </>,
    { strokeWidth: "2" }
  )

const GridIcon = () =>
  icon(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  )

const GaugeIcon = () =>
  icon(
    <>
      <path d="M4 15.5a8 8 0 1116 0" />
      <path d="M12 15.5l3.5-4.5" />
      <path d="M2 19h20" />
    </>
  )

const LayersIcon = () =>
  icon(
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  )

const ActivityIcon = () => icon(<path d="M22 12h-4l-3 8-4-16-3 8H2" />)

const HeartPulseIcon = () =>
  icon(
    <>
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 000-7.8z" />
      <path d="M3.5 12.5h4l2-3 3 6 2-3h6" />
    </>
  )

const CreditCardIcon = () =>
  icon(
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </>
  )

const UserIcon = () =>
  icon(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" />
    </>
  )

const CpuIcon = () =>
  icon(
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </>
  )

const ShieldIcon = () => icon(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />)

const BarChartIcon = () =>
  icon(
    <>
      <line x1="6" y1="20" x2="6" y2="13" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="18" y1="20" x2="18" y2="9" />
    </>
  )

const RacksIcon = () =>
  icon(
    <>
      <rect x="2" y="3" width="20" height="7" rx="2" />
      <rect x="2" y="14" width="20" height="7" rx="2" />
      <line x1="6" y1="6.5" x2="6.01" y2="6.5" />
      <line x1="6" y1="17.5" x2="6.01" y2="17.5" />
    </>
  )

const GlobeIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a14 14 0 010 18 14 14 0 010-18z" />
    </>
  )

const DiskStackIcon = () =>
  icon(
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </>
  )

const LifebuoyIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <line x1="5.6" y1="5.6" x2="9.5" y2="9.5" />
      <line x1="14.5" y1="14.5" x2="18.4" y2="18.4" />
      <line x1="14.5" y1="9.5" x2="18.4" y2="5.6" />
      <line x1="5.6" y1="18.4" x2="9.5" y2="14.5" />
    </>
  )

const DownloadIcon = () =>
  icon(
    <>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7.5 10.5 12 15 16.5 10.5" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  )

const GearIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
    </>
  )

export const InfoIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>,
    { strokeWidth: "2" }
  )

export const SlidersIcon = () =>
  icon(
    <>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </>
  )

export const ClockIcon = () =>
  icon(
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </>
  )

export const ArchiveIcon = () =>
  icon(
    <>
      <rect x="2" y="4" width="20" height="5" rx="1" />
      <path d="M4 9v10a2 2 0 002 2h12a2 2 0 002-2V9" />
      <line x1="10" y1="13" x2="14" y2="13" />
    </>
  )

const BookIcon = () =>
  icon(
    <>
      <path d="M4 4.5A2.5 2.5 0 016.5 2H20v15H6.5A2.5 2.5 0 004 19.5z" />
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20v5H6.5A2.5 2.5 0 014 19.5z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="13.5" y2="11" />
    </>
  )

export const CheckIcon = () => icon(<polyline points="20 6 9 17 4 12" />, { strokeWidth: "2" })

/* Every row in either rail carries an icon: categories in the primary rail,
   services in the secondary. Keyed by id; the lookup has no fallback to
   the Overview grid, so a new service must bring its own glyph. */
export const CATEGORY_ICONS = {
  overview: GridIcon,
  vdcs: RacksIcon,
  operations: ActivityIcon,
  account: UserIcon,
  "support-center": LifebuoyIcon,
}

const SERVICE_ICONS = {
  overview: GaugeIcon,
  resources: CpuIcon,
  networking: GlobeIcon,
  storage: DiskStackIcon,
  quotas: SlidersIcon,
  order: CartIcon,
  "data-centers": RacksIcon,
  metrics: BarChartIcon,
  events: ActivityIcon,
  "service-health": HeartPulseIcon,
  billing: CreditCardIcon,
  security: ShieldIcon,
  "your-data": DownloadIcon,
  settings: GearIcon,
  support: LifebuoyIcon,
  documentation: BookIcon,
}

export const serviceIcon = (svc) => SERVICE_ICONS[svc.id] ?? (svc.collapsible ? SiteIcon : LayersIcon)

/* Order wizard: workloads, sharing, the table toolbar and the deploy flow. */
export const CodeIcon = () => icon(<><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>)
export const DatabaseIcon = () =>
  icon(<><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>)
export const GpuIcon = () =>
  icon(<><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="9" cy="12" r="3" /><path d="M15 9.5h4M15 12h4M15 14.5h4" /><path d="M6 18v3M18 18v3" /></>)
export const ArrowDownIcon = () => icon(<><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></>, { strokeWidth: "2" })
export const ShieldCheckIcon = () => icon(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>)
export const PuzzleIcon = () =>
  icon(
    <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
  )
export const MapPinIcon = () => icon(<><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>)
export const MailIcon = () => icon(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></>)
export const LinkIcon = () =>
  icon(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>)
export const PinIcon = () =>
  icon(<><path d="M12 17v5" /><path d="M9 10.76V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4.76l2.55 1.7A1 1 0 0 1 17 14H7a1 1 0 0 1-.55-1.83z" /></>)
export const ColumnsIcon = () => icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 3v18" /></>)
export const GroupIcon = () =>
  icon(<><path d="M3 7h6M3 12h6M3 17h6" /><rect x="13" y="5" width="8" height="6" rx="1" /><rect x="13" y="14" width="8" height="6" rx="1" /></>)
export const RowsExpandIcon = () => icon(<><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></>, { strokeWidth: "2" })
export const RocketIcon = () =>
  icon(
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </>
  )
export const TerminalIcon = () => icon(<><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></>)
export const AlertCircleIcon = () =>
  icon(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>, { strokeWidth: "2" })
export const CheckCircleIcon = () => icon(<><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>, { strokeWidth: "2" })
export const SparkleIcon = () =>
  icon(<><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z" /></>)
export const LockIcon = () => icon(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>)
export const CopyIcon = () => icon(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>)
export const FilterIcon = () => icon(<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />)
export const ImageIcon = () => icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>)
export const CameraIcon = () =>
  icon(<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>)
export { CpuIcon, DownloadIcon, GlobeIcon, GridIcon, LayersIcon, ShieldIcon, UserIcon }
