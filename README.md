# Reserve UI — Demo Frontend for Generic Reservation Microservice

A responsive, accessible demo UI built with **React 18**, **TypeScript** (strict mode), **Vite**, **Tailwind CSS**, and **TanStack Query** for the open-source [reserve-service](https://github.com/xssirr17/reserve-service) Spring Boot backend.

---

## Architecture & Principles

- **Completely Generic**: Operates against any bookable resource (meeting rooms, consultants, classroom sessions, gym lockers, etc.). No domain-specific wording is hardcoded.
- **Contract-Accurate**: Strictly maps Spring Boot DTOs, Spring Data `Page<T>` pagination, and RFC 7807 Problem Details error responses.
- **Idempotency-First**: Automatically manages client-generated `Idempotency-Key` headers using `crypto.randomUUID()`. The same key is reused across transient network error retries, while fresh keys are generated whenever attempt parameters change.
- **Real-Time Capacity**: Visual capacity bars differentiate single-capacity resources ("Available / Booked") from multi-unit resources ("*N* of *M* left") and automatically update after reservations or conflicts.
- **No-Admin Windows Friendly**: Runs smoothly with portable Node.js and standard PowerShell on Windows with zero admin privileges or Docker requirements.

---

## Quickstart (Windows without Admin Rights)

### 1. Portable Node.js Installation (No Admin Required)
If Node.js is not already installed on your Windows machine:
1. Download the Windows binary `.zip` (e.g. `node-v20.x.x-win-x64.zip` or `node-v22.x.x-win-x64.zip`) from [nodejs.org/dist](https://nodejs.org/dist/).
2. Extract the archive into your user folder, e.g. `C:\Users\<username>\bin\node`.
3. In PowerShell, temporarily or permanently add Node to your user `PATH`:
   ```powershell
   $env:PATH = "C:\Users\$env:USERNAME\bin\node;$env:PATH"
   node -v
   npm -v
   ```

### 2. Ensure Backend Is Running
The backend microservice defaults to `http://localhost:8080`.
```powershell
# In the backend repo root (e.g. ..\reserve)
.\gradlew.bat bootrun
```

### 3. Install & Start Frontend Dev Server
```powershell
# In reserve-ui directory
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Seed Demo Data

The backend provides endpoints to create resources and slots. Run the standalone seed script to populate sample items (Boardroom Alpha, Advisory Consultant, and a 20-person Studio Masterclass) with future slots tomorrow:

```powershell
# Using npm script:
npm run seed

# Or directly with PowerShell:
.\scripts\seed.ps1 -TargetUrl http://localhost:8080

# Or with Node:
node scripts/seed.mjs http://localhost:8080
```

---

## Environment Variables & Proxy Setup

Copy `.env.example` to `.env`:

```env
# Application title displayed in the header and document title
VITE_APP_TITLE="Reserve — Generic Resource Booking"

# Vite dev-server proxy target (used by Vite proxy in development)
VITE_API_TARGET="http://localhost:8080"

# Optional direct API base URL (used for production/deployed builds when not using the Vite proxy)
# Defaults to empty string (relative paths /api/...)
VITE_API_BASE_URL=""
```

### How the Proxy Works
In development, the Vite dev server transparently proxies all requests beginning with `/api` and `/actuator` to `http://localhost:8080` (configured via `VITE_API_TARGET`). This allows client-side development without requiring any CORS configuration or origin headers changes on the Spring Boot backend.

For deployed builds, setting `VITE_API_BASE_URL` directs calls to an API gateway or reverse proxy if needed.

---

## Authentication Note
The `reserve-service` backend does not implement user authentication. The **User Name / ID** field in the booking form is simply the client-supplied `userId` string expected by `CreateReservationRequest`. For user convenience, the UI persists this value in browser `localStorage` (wrapped in try/catch).

---

## Dependencies & Rationale

We maintain a minimal dependency footprint:

| Dependency | Purpose | Rationale |
| :--- | :--- | :--- |
| `react` & `react-dom` (^18.3.1) | UI Library | React 18 with concurrent features and stable hooks. |
| `@tanstack/react-query` (^5.60.5) | Server State Management | Provides query caching, loading/error states, and declarative invalidation of availability upon booking or 409 conflict. |
| `lucide-react` (^0.460.0) | Icons | Lightweight, tree-shakeable icons for status badges, copy actions, and indicators. |
| `tailwindcss` (^3.4.15) | Styling | Utility-first CSS supporting native `prefers-color-scheme` dark mode and responsive design without heavy runtime overhead. |
| `vitest` (^2.1.5) | Testing Framework | Fast, Vite-native test runner with out-of-the-box ESM and TypeScript support. |
| `@testing-library/react` | Component Testing | Validates user-facing behavior and accessibility without requiring a running backend. |

No heavy UI component libraries (Material UI, Ant Design) or global state managers (Redux) are included.

---

## Project Structure

```
reserve-ui/
├── scripts/
│   ├── seed.mjs               # Standalone Node demo data seeder
│   └── seed.ps1               # Standalone PowerShell demo data seeder
├── src/
│   ├── api/
│   │   ├── client.ts          # Typed fetch wrapper + RFC 7807 Problem Details parser
│   │   ├── health.ts          # Actuator health endpoint client
│   │   ├── reservations.ts    # POST /api/reservations and saga hooks
│   │   ├── resources.ts       # GET /api/resources, GET /api/resources/{id}
│   │   ├── slots.ts           # GET /api/resources/{id}/availability
│   │   └── types.ts           # Exact Spring Boot DTO & Page<T> contracts
│   ├── components/
│   │   ├── CapacityBar.tsx     # Generic 1 vs N capacity visualization
│   │   ├── ErrorBanner.tsx    # RFC 7807 problem details & 503 retry countdown
│   │   ├── Header.tsx         # Configurable branding & backend health pill
│   │   ├── LoadingSkeleton.tsx# Responsive skeleton screens
│   │   ├── MetadataList.tsx   # Generic key-value renderer for free-form JSON
│   │   ├── RequestLog.tsx     # Collapsible diagnostic panel (status, headers, payload)
│   │   ├── ReservationForm.tsx# Validated form with automatic idempotency key
│   │   ├── ReservationResult.tsx # PENDING state with live expiry countdown
│   │   ├── ResourceCard.tsx   # Neutral resource card with type badge
│   │   └── SlotPicker.tsx     # Day-grouped slots with local time zone display
│   ├── hooks/
│   │   ├── useAvailability.ts # Query availability with auto-caching
│   │   ├── useBackendHealth.ts# Actuator health poller
│   │   ├── useCountdown.ts    # High-precision expiry countdown hook
│   │   ├── useCreateReservation.ts # Mutation invalidating availability
│   │   ├── useIdempotencyKey.ts # Attempt-aware idempotency key management
│   │   └── useResources.ts    # Paginated resources query
│   ├── lib/
│   │   ├── constants.ts       # Configurable defaults
│   │   ├── format.ts          # UTC <-> Local time, day grouping & capacity labels
│   │   └── storage.ts         # Safe localStorage persistence
│   ├── pages/
│   │   └── ResourcesPage.tsx  # Main responsive reservation page
│   ├── test/
│   │   ├── bookingFlow.test.tsx # Happy path & 409 conflict component tests
│   │   ├── format.test.ts     # Capacity logic & day grouping unit tests
│   │   ├── metadata.test.tsx  # Free-form JSON edge case unit tests
│   │   ├── problemDetails.test.ts # RFC 7807 parsing unit tests
│   │   ├── setup.ts           # Testing-library polyfills & cleanup
│   │   └── useIdempotencyKey.test.ts # Idempotency key reuse & refresh tests
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── eslint.config.js
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Verifying Code Quality & Tests

Run all checks from the workspace root:

```powershell
# Run ESLint (must pass with 0 warnings)
npm run lint

# Run Unit & Component Tests (offline, no backend required)
npm test

# Production TypeScript check & Vite build
npm run build
```

---

## Roadmap (Next Steps)

1. **Confirmation & Cancellation Flow**: Integrate `POST /api/reservations/{id}/confirm` (external payment saga) and `POST /api/reservations/{id}/cancel` (capacity release).
2. **Interactive Idempotency Demo**: Visual playground to intentionally replay the same `Idempotency-Key` with identical vs mutated payloads to demonstrate cached 201 replays vs `422 Unprocessable Entity`.
3. **Concurrent Stress Testing**: Multi-tab or multi-worker race demonstration showing atomic slot reservation under high concurrency, verifying rejection with `409 Insufficient Capacity` or `Retry-After`.
4. **Transactional Outbox Viewer**: Polling interface to inspect `outbox_events` and demonstrate reliable domain event publishing with saga compensation.
