# SMS Client Progress Handoff (Cursor)

## Purpose
This file is a handoff guide so another Cursor session (on another PC) can continue implementation with the same structure, UI style, and workflow.

## Workspace Paths (important)
- Root artifacts path:
  - `C:\Users\delar\Downloads\PETROSPHERE_PROJECT\School-System-UI\artifacts`
- Client repo:
  - `C:\Users\delar\Downloads\PETROSPHERE_PROJECT\School-System-UI\artifacts\sms-client`
- Server repo:
  - `C:\Users\delar\Downloads\PETROSPHERE_PROJECT\School-System-UI\artifacts\sms-server`

## Project Structure (high-level)
- `src/app/colleges/[slug]/page.tsx`
  - Main colleges slug router.
  - Loads each module component by `slug`.
- `src/lib/colleges-nav.ts`
  - Source of colleges menu labels/slugs.
- `src/components/colleges/*`
  - Legacy-style colleges modules (new and existing).
- `src/components/setup/*`
  - Setup manager modules.

## Implemented Colleges Modules (legacy-style UI)
- `ClassSectioningGsHsModule.tsx`
  - Path: `src/components/colleges/ClassSectioningGsHsModule.tsx`
  - Slug: `class-sectioning-gs-hs`
- `ClassSchedulesRoomFacultyModule.tsx`
  - Path: `src/components/colleges/ClassSchedulesRoomFacultyModule.tsx`
  - Slug: `class-schedules-room-faculty`
  - Includes tab-specific right panel UI (Class/Room/Faculty) and schedule grid behavior.
- `ClassSectionsSplitMergeModule.tsx`
  - Path: `src/components/colleges/ClassSectionsSplitMergeModule.tsx`
  - Slug: `class-sections-split-merge`
- `ClassSchedulesSplitMergeModule.tsx`
  - Path: `src/components/colleges/ClassSchedulesSplitMergeModule.tsx`
  - Slug: `class-schedules-split-merge`
- `ForecastingModule.tsx`
  - Path: `src/components/colleges/ForecastingModule.tsx`
  - Slug: `forecasting`
- `ListOfReportsModule.tsx`
  - Path: `src/components/colleges/ListOfReportsModule.tsx`
  - Slug: `list-of-reports`

## Colleges Slug Router Status
In `src/app/colleges/[slug]/page.tsx`, the following slugs are already wired:
- `program-curriculums`
- `program-curriculum-bulk-tagging`
- `class-sections`
- `class-sectioning-gs-hs`
- `class-schedules-room-faculty`
- `class-sections-split-merge`
- `class-schedules-split-merge`
- `forecasting`
- `list-of-reports`

## Important Setup Module Fixes Already Done
- `src/components/setup/BuildingsRoomsModule.tsx`
  - Action toolbar moved from bottom to top for visibility.
  - Add Room dialog fixed: building dropdown now uses the correct source (`buildingOptions`), so building/floor data loads correctly.

## API Endpoints Currently Used
- `GET /api/academic-year-terms`
- `GET /api/campuses`
- `GET /api/academic-programs`
- `GET /api/courses-master-list`
- `GET /api/buildings-rooms/tree`
- `GET /api/buildings-rooms/rooms?floor_id=...`
- `GET /api/employees?hide_inactive=true`

`NEXT_PUBLIC_API_URL` is configured in `.env.local` and expected to point to backend server (currently localhost).

## UI/Styling Rules Followed
- Goal: mimic legacy desktop forms/screens from screenshots.
- Palette/style:
  - emerald/blue gradients for headers and section bars
  - compact text sizing (`text-[9px]` to `text-[12px]` in dense forms)
  - bordered panes and table-like grids
- Behavior:
  - keep UI visible even when API is unavailable
  - use placeholders/toasts for actions not yet wired to backend transfer/post endpoints

## Recent Layout Notes
- `ClassSchedulesRoomFacultyModule.tsx`
  - schedule grid panel is fixed height and scrollable
  - right panel made more compact/slick
- `ForecastingModule.tsx`
  - left offered-subject list height reduced
  - right gray panel height aligned with left to remove blank space mismatch

## Known Functional Gaps (next tasks)
- Split/Merge modules:
  - row selection and actual student move logic is placeholder only
  - transfer actions currently toast and need backend integration
- Forecasting:
  - right forecast table is shell UI (no forecasting compute/save endpoint integration yet)
- List of Reports:
  - parameter controls are mostly UI shell; report execution/preview pipeline still needed

## Development Process Notes
- After changes, run:
  - `npx tsc --noEmit`
  - lints for touched files
- Avoid committing generated `.next` artifacts.
- Keep new colleges screens in separate module files under `src/components/colleges/`.
- Wire new screens only through `src/app/colleges/[slug]/page.tsx` to keep routing centralized.

## Quick Resume Checklist (for next Cursor session)
1. Open `src/app/colleges/[slug]/page.tsx` and verify slug mapping.
2. Open the target module in `src/components/colleges/`.
3. Compare UI to legacy screenshot and refine spacing/colors first.
4. Wire real API behavior after visual parity is achieved.
5. Re-run typecheck/lints.

