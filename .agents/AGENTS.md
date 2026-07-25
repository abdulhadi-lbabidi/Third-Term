# Project-Scoped Rules: Department Build Guide & UI/UX Standards

When building any new feature, department, or module in this project, strictly follow these standards:

## 1. Workflow Steps
1. **Read the PRD**: Check `PRD.md` to understand requirements, statistics, and CRUD operations. 
2. **API Validation**: Test each API with Postman to ensure it works correctly before proceeding [APIs](financial_nouh_api.postman_collection.json).
3. **Database Analysis**: Check `DB.sql` to extract Types and Relations.
4. **Generate Types & APIs**: Build the interfaces and API endpoints.
5. **Build UI Components**: Cards, Tables, Forms, and Dialogs.
6. **Page Assembly**: Combine components in the main department page.
7. **Router**: Add the route in `src/app/router/index.tsx`.
8. **Sidebar**: Add the section to `src/features/layouts/components/sidebar.tsx`.
9. **Testing & Validation**: Run CLI validation (`tsc`/linter), update API test lists, and resolve UI problem scenarios.

## 2. File Architecture (Clean Architecture)
Put every feature inside `src/features/` with this exact structure:
```text
src/features/{department_name}/
├── components/
│   ├── {entity}.card.tsx      # Stat cards or single item views
│   ├── {entity}.table.tsx     # Data table
│   ├── {entity}.form.tsx      # react-hook-form + zod form
│   ├── {entity}.dialog.tsx    # Dialog wrapping the form
│   └── {department}-tabs.tsx  # Navigation tabs (if applicable)
├── {department}.api.ts            # Data fetching layer using ApiClient
├── {department}.hooks.ts          # React Query hooks (useQuery, useMutation)
├── types.ts                       # Interfaces/Types
└── {department}.page.tsx          # Main wrapper page
```

## 3. From DB to APIs
- **Types (`types.ts`)**: Map database columns to TypeScript interfaces. Accurately define optional `?` and required fields.
- **APIs (`{department}.api.ts`)**: ALWAYS use `ApiClient` from `@/shared/api/api-client` (not axios) to fetch data. Be sure to include `successMessage` in mutations if the server doesn't return one.
- **Hooks (`{department}.hooks.ts`)**: ALWAYS use `@tanstack/react-query` to wrap API calls (e.g., `useQuery`, `useMutation`).
## 4. UI/UX & Skeleton (Premium Design)
- **Header Structure**: Use a container with `border-slate-200/80` and `shadow-sm`. Include a Pill Badge (`bg-slate-100 uppercase`), an `h1` Title (`font-semibold`), and an Action Button (`bg-slate-950`) on the left/right for adding a new item.
- **Statistics Cards**: Display stats in a Grid at the top. Use prominent numbers (`text-2xl font-bold`) and subtle icons from `lucide-react`.
- **Data Tables**: Use `react-data-table-component`. Header should have a light gray background. Actions column at the end with generic icons (`Eye`, `Edit2`, `Trash2` colored `text-destructive`).
- **Forms**: Always use `react-hook-form` + `zod`. Show clear error messages below inputs. Disable the submit button and show a Loading State during submission.
- **Skeletons**: Never use generic Spinners for data loading. Use `Skeleton` components that mimic the shape of tables or cards (`isLoading`).

## 5. UX Writing
- **Clarity**: Use clear, actionable verbs (e.g., "Add New Box" instead of "Submit").
- **Confirmation Dialogs**: For destructive actions like delete, prompt the user with "Are you sure you want to delete [Item Name]? This action cannot be undone."
- **Toasts**: Use `sonner` to display green success or red error messages upon completing CRUD operations.

## 6. API Testing & Problem Scenarios
- **API Test List**: Every new API you add MUST be added to a testing list.
- **Problem Scenarios Report**: Create a report to track all UI problem scenarios and edge cases you resolve, and add it to the project documentation.
- **UI Updates**: Update the user interface accordingly based on testing and problem resolution.
- **CLI Validation**: Test each modified or newly created file via the CLI to ensure there are no errors (e.g., using `tsc` or linter).
- **Workflow Priority**: These steps must be completed before continuing with the rest of the workflow steps.
# update resources
[for tables components](../src/features/components/data-table.tsx)