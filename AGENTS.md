<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Database Table Isolation Rule
- **CRITICAL**: This project shares a database with other client projects.
- **STRICT PREFIX**: ONLY query, create, update, or modify tables with the `tce_` prefix (e.g., `tce_menu_items`, `tce_orders`, `tce_customers`, `tce_inventory`, `tce_*`).
- **NEVER TOUCH NON-TCE TABLES**: Do NOT read, write, modify, drop, or alter any table that does not start with `tce_` (such as `zb_*` or any legacy tables).

