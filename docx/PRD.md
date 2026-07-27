# Authentication:
- login `/auth/login` components form {email or phone_number, password}
- register `/auth/register` components form {name, email, password, phone_number, address}
- forget password `/auth/forget-password` components form {email or phone_number}
- reset password `/auth/reset-password` components form {email or phone_number}

# Dashboard:
# HR:
<!-- Overview: cards statistics: [ total users, employees, engineers, daily workers, craftsmen, clients, suppliers, investors, trustees] -->

## Users `/users`:

- forms: [ create user, update user, reset password, update permissions, delete user]
- table: [name, email, phone_number, role, actions]
- search[name, email, phone_number]
- filters dialog [email_verified_at, range_date_created_at, range_date_updated_at]
- Tabs: [all, employees, engineers, daily workers, craftsmen, clients, suppliers, investors, trustees]
  - Employees: 
    - table details: [name, email, phone_number, job_title, actions]
      - actions: [details for one, update job title, payroll history, update data]
    - details for one[dialog]: [all data fields + role]
    - create employee[form]: [name, email, phone_number, address, job_title]
    - update job title[form]: [job_title]
    - update data[form]: [name, email, phone_number, address]

  - Engineers:
    - table details: [name, email, phone_number, job_title, base_salary, actions]
      - actions: [details for one, update job title, update base salary, update data]
    - details for one[dialog]: [all data fields + role]
    - create engineer[form]: [name, email, phone_number, address, job_title, base_salary]
    - update job title[form]: [job_title]
    - update base salary[form]: [base_salary]
    - update data[form]: [name, email, phone_number, address, base_salary]

  - Daily Workers:
    - table details: [name, email, phone_number, actions]
      - actions: [details for one, update data]
    - details for one[dialog]: [all data fields + role]
    - create daily worker[form]: [name, email, phone_number, address]
    - update data[form]: [name, email, phone_number, address]

  - Craftsmen:
    - table details: [name, email, phone_number, actions]
      - actions: [details for one, update data]
    - details for one[dialog]: [all data fields + role]
    - create craftsman[form]: [name, email, phone_number, address]
    - update data[form]: [name, email, phone_number, address]

  - Clients:
    - table details: [name, email, phone_number, actions]
      - actions: [details for one, update data]
    - details for one[dialog]: [all data fields + role]
    - create client[form]: [name, email, phone_number, address]
    - update data[form]: [name, email, phone_number, address]

  - Suppliers:
    - table details: [name, email, phone_number, actions]
      - actions: [details for one, update data]
    - details for one[dialog]: [all data fields + role]
    - update data[form]: [name, email, phone_number, address]

  - Investors: @@
    - table details: [name, email, phone_number, investment_ratio, actions]
      - actions: [details for one, update data, update investment ratio]
    - details for one[dialog]: [all data fields + role + investment_ratio]
    - create investor[form]: [name, email, phone_number, address, investment_ratio]
    - update data[form]: [name, email, phone_number, address, investment_ratio]

  - Trustees:
    - table details: [name, email, phone_number, actions]
      - actions: [details for one, update data]
    - details for one[dialog]: [all data fields + role]
    - create trustee[form]: [name, email, phone_number, address]
    - update data[form]: [name, email, phone_number, address] 

# According
## Currencies `/currencies`
<!-- - table details: [name, symbol, rate, actions]
  - actions: [details for one, update, delete]
- details for one[dialog]: [all data fields]
- create[form]: [name, symbol, rate]
- update[form]: [name, symbol, rate]
- delete[dialog]: [are you sure you want to delete this currency?] -->

## Funds `/funds`
- statistics: [total_funds, personal_funds, company_funds, project_funds, total_balance, currencies]
- tabs: [funds, company, projects]
  - funds
    - search: [name]
    - create[form]: {name, currency_fund,owner}
    - table details: [name, currency_fund, balance, owner, actions]
    - filters: [currency_fund,owner,range_create_at]
    - actions: [details, update, delete] 
    - details for one `/funds/{id}`: 
      - all data fields + role
      - Revenues 
  - company
    - search: [name]
    - create[form]: {name, currency_fund,owner}
    - table details: [name, currency_fund, balance, actions]
    - filters: [currency_fund,range_create_at]
    - actions: [details, update, delete]
    - details for one `/funds-company/{id}`: 
      - all data fields + role
  - projects
    - search: [name]
    - create[form]: {name, currency_fund,owner}
    - table details: [project, fund, currency_fund, balance, actions]
    - filters: [project, fund, currency_fund,range_create_at]
    - actions: [details, update, delete] 
    - details for one `/funds-project/{id}`: 
      - all data fields + role
      - Revenues
      - Expenses
      - invoices 
## Invoices `/invoices`
- statistics[cards]: [total_invoices, total_invoice_amount, posted_amount, pending_posting_amount, invoices_this_month, invoices_today, average_invoice_value, top_supplier]
- table details: [invoice_number, supplier, target_fund, invoice_date, final_total, discount_amount, status, posted, actions]
  - actions[dialog]: [details, update, post, print, download pdf, delete] 
  - filters: [supplier, target_fund, date_range, posted, visible_to_client]
- details for one [dialog]:{details, print, download pdf, invoice_number, invoice_date, supplier, target_fund, invoice_items, discount, final total, posting status}   
- create [form]: { supplier, target_fund, invoice_number, invoice_date, discount, posting_status, visibility_to_client}
  - invoice items: {item, description, unit, quantity, unit_price, total_price} & buttons [add item, remove item] 
- update [form]: { supplier, target_fund, invoice_number, invoice_date, discount, posting_status, visibility_to_client}
  - invoice items: {item, description, unit, quantity, unit_price, total_price} & buttons [add item, update item, remove item] 
  - posting status
  - visibility to client
  - delete[dialog]: {are you sure you want to delete this invoice?}
- search: [invoice number, supplier, item]
- export: PDF, Excel

## Expenses `/expenses`
- table details: [name, symbol, rate, actions]
  - actions: [details for one, update, delete]
- details for one[dialog]: [all data fields]
- create[form]: [name, symbol, rate]
- update[form]: [name, symbol, rate]
- delete[dialog]: [are you sure you want to delete this currency?]

## Revenues `/revenues`
- table details: [name, symbol, rate, actions]
  - actions: [details for one, update, delete]
- details for one[dialog]: [all data fields]
- create[form]: [name, symbol, rate]
- update[form]: [name, symbol, rate]
- delete[dialog]: [are you sure you want to delete this currency?]

## Payroll `/payroll`
- table details: [name, symbol, rate, actions]
  - actions: [details for one, update, delete]
- details for one[dialog]: [all data fields]
- create[form]: [name, symbol, rate]
- update[form]: [name, symbol, rate]
- delete[dialog]: [are you sure you want to delete this currency?]

# cloud storage
- grid view
  - header: 
    <!-- - search "in directory" -->
    <!-- - create folder -->
    <!-- - upload files -->
    - select files
      - copy
      - move
      - delete
  <!-- - show items inside directory [files, folders] -->
<!-- - create new folders [dialog,form]:{name} -->
<!-- - upload files [dialog,form]:{files} -->
<!-- - delete file/folder [dialog] -->
<!-- - rename folder [dialog,form]:{name} -->
<!-- - move folder [drag and drop] to another directory -->
- move file [drag and drop] to another directory
<!-- - cards: [file,folder] -->
  <!-- - view icon for extenion type: pdf,excel,images, -->
<!-- - options[on_click_menu,dialog]: -->
  <!-- - preview -->
  <!-- - download -->
  <!-- - rename -->
  <!-- - delete -->
<!-- - get for projects -->
  <!-- - new folder -->
  <!-- - upload files -->
  
      
## Projects `/projects`

- statistics [card]: [total_projects, active_projects, completed_projects, suspended_projects, pending_projects, total_contract_value, total_project_balance, total_project_profit]
- tabs [all, proposed, design, execution, completed, suspended]: 
  - All [table details]: [project_name, client, status, contract_value, profit_type, start_date, actions]
  - Proposed [table details]: [project_name, client, status, contract_value, profit_type, start_date, actions]
  - Design [table details]: [project_name, client, status, contract_value, profit_type, start_date, actions]
  - Execution [table details]: [project_name, client, status, contract_value, profit_type, start_date, actions]
  - Completed [table details]: [project_name, client, status, contract_value, profit_type, start_date, actions]
  - Suspended [table details]: [project_name, client, status, contract_value, profit_type, start_date, actions]
- actions[dialog]: [details, update, archive, delete] 
- create [form]: 
  - basic information: [project_name, client, status, profit_type]
  - financial information: [expected_contract_value, project_fund]
  - dates: [start_date, end_date]
- update [form]: 
  - basic information: [project_name, client, status, profit_type]
  - financial information: [expected_contract_value, project_fund]
  - dates: [start_date, end_date]
- details `/projects/{id}`:
  - basic information: [project_name, client, status, profit_type]
  - dates: [start_date, end_date]
  - financial information: [expected_contract_value, project_fund]
  - tabs:
    - cloud_storage: [cloud storage]
    - client
      - list of client data
      - update client details
      - add client [form]
    - project_fund
      - revenues:
        - list project revenues
      - expenses:
        - list project expenses
      - invoices:
        - list project invoices 
