# Project-Scoped Rules: Department Build Guide & UI/UX Standards

When building any new feature, department, or module in this project, strictly follow these standards:

## 1. Workflow Steps
1. **Read the PRD**: Check `PRD.md` to understand requirements, statistics, and CRUD operations + [APIs](financial_nouh_api.postman_collection.json)

2. **Database Analysis**: Check `DB.sql` to extract Types and Relations.
3. **Generate Types & APIs**: Build the interfaces and API endpoints.
4. **Build UI Components**: Cards, Tables, Forms, and Dialogs.
5. **Page Assembly**: Combine components in the main department page.
6. **Router**: Add the route in `src/app/router/index.tsx`.
7. **Sidebar**: Add the section to `src/features/layouts/components/sidebar.tsx`.

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
├── {department}.api.ts            # Axios calls (GET, POST, PATCH, DELETE)
├── types.ts                   # Interfaces/Types
└── {department}.page.tsx      # Main wrapper page
```

## 3. From DB to APIs
- **Types (`types/index.ts`)**: Map database columns to TypeScript interfaces. Accurately define optional `?` and required fields.
- **APIs (`api/{entity}.api.ts`)**: ALWAYS use `apiClient` from `axios.instance.ts` so the Auth Token is injected automatically.

## 4. UI/UX & Skeleton (Premium Design)
- **Header Structure**: Use a container with `border-slate-200/80` and `shadow-sm`. Include a Pill Badge (`bg-slate-100 uppercase`), an `h1` Title (`font-semibold`), and an Action Button (`bg-slate-950`) on the left/right for adding a new item.
- **Statistics Cards**: Display stats in a Grid at the top. Use prominent numbers (`text-2xl font-bold`) and subtle icons from `lucide-react`.
- **Data Tables**: Use `react-data-table-component`. Header should have a light gray background. Actions column at the end with generic icons (`Eye`, `Edit2`, `Trash2` colored `text-destructive`).
- **Forms**: Always use `react-hook-form` + `zod`. Show clear error messages below inputs. Disable the submit button and show a Loading State during submission.
- **Skeletons**: Never use generic Spinners for data loading. Use `Skeleton` components that mimic the shape of tables or cards (`isLoading`).

## 5. UX Writing & i18n
- **Multi-language**: All text MUST be passed through `useTranslation()` (e.g., `t('key', 'Fallback text')`).
- **Clarity**: Use clear, actionable verbs (e.g., "Add New Box" instead of "Submit").
- **Confirmation Dialogs**: For destructive actions like delete, prompt the user with "Are you sure you want to delete [Item Name]? This action cannot be undone."
- **Toasts**: Use `sonner` to display green success or red error messages upon completing CRUD operations.
