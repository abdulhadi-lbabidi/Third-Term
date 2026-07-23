// Users & Roles (One-to-One / Polymorphic-like relationships)
Table users {
  id bigint [primary key, increment]
  name string [note: 'اسم المستخدم']
  email string [unique,note: 'الإيميل'] 
  email_verified_at timestamp [null,note: 'محقق']
  password string [note: 'كلمة المرور']
  phone_number string [null,note: 'رقم الهاتف']
  address string [null,note: 'مكن السكن']
  remember_token string
  created_at timestamp
  updated_at timestamp
}

Table Admin {
  id bigint [primary key, increment]
  user_id bigint [note: 'cascade on delete']

}

Table Investor {
  id bigint [primary key, increment]
  user_id bigint [note: 'cascade on delete']
  Investment_ratio decimal(15,2) [note: 'الإيميل']
  created_at timestamp
  updated_at timestamp
}

Table engineers {
  id bigint [primary key, increment]
  user_id bigint [note: 'cascade on delete']
  job_title string
  base_salary decimal(15,2)
  created_at timestamp
  updated_at timestamp
}

Table daily_workers {
  id bigint [primary key, increment]
  user_id bigint [note: 'cascade on delete']
  created_at timestamp
  updated_at timestamp
}

Table craftsmens {
  id bigint [primary key, increment]
  user_id bigint [note: 'cascade on delete']
  created_at timestamp
  updated_at timestamp
}

Table clients {
  id bigint [primary key, increment]
  user_id bigint [note: 'cascade on delete']
  created_at timestamp
  updated_at timestamp
}

Table employees {
  id bigint [primary key, increment]
  user_id bigint [note: 'cascade on delete']
  job_title string
  created_at timestamp
  updated_at timestamp
}

Table suppliers {
  id bigint [primary key, increment]
  user_id bigint [note: 'cascade on delete']
  created_at timestamp
  updated_at timestamp
}

Table trustees {
  id bigint [primary key, increment]
  user_id bigint [note: 'cascade on delete']
  created_at timestamp
  updated_at timestamp
}

Table funds {
  id bigint [primary key, increment]
  user_id bigint [note: 'cascade on delete']
  name string
  created_at timestamp
  updated_at timestamp
}
Table currency {
  id bigint [primary key, increment]
  currency string 
  symbol string
}
Table currency_fund {
  id bigint [primary key, increment]
  currency_id bigint 
  fund_id bigint
  balance decimal(15,2)
  
}
Table currency_company {
  id bigint [primary key, increment]
  currency_id bigint 
  fund_id bigint
  balance decimal(15,2)
  
}
Table currency_project {
  id bigint [primary key, increment]
  currency_id bigint 
  fund_id bigint
  balance decimal(15,2)
  
}

// Items & Materials
Table items {
  id bigint [primary key, increment]
  name string
  description text [null]
  created_at timestamp
  updated_at timestamp
}








// --- نظام الصناديق والحسابات الماليّة ---
Table Project_Funds {
  id integer [primary key, increment]
  name varchar [note: 'اسم الصندوق: صندوق الشركة، صندوق المشروع، إلخ']
  project_id integer [null, note: 'يرتبط بالمشروع إذا كان صندوق مشروع']
  created_at timestamp
}

// --- الموارد البشرية والموظفين ---


Table Employee_Payment {
  id integer [primary key, increment]
  employee_id integer
  date date
  bonus decimal [default: 0, note: "إضافات"]
  deductions decimal [default: 0 , note: "خصومات"]
  salary_amount decimal
  paid_at timestamp
  company_fund_id bigint
}

// --- الحركات المالية بالدولار (سندات الصرف والإيرادات والمناقلات) ---
Table Expenses {
  id integer [primary key, increment]
  morph_fund_id integer [note: 'مصروف شركة، مصروف عمال، أمانات، مشاريع، إلخ']
  name text [note: 'البيان']
  amount decimal [note: 'القيمة']
  created_at timestamp
  is_posted boolean [default: true, note: 'false تعني دفعة غير مرحلة تحول لصندوق المبالغ غير المرحلية']
  employee_id integer [null, note: 'آمر الصرف للمطابقة والمناقلة الأسبوعية']
  created_by integer [null, note: 'تحديد من منشئ المصروف']

}

Table Revenues {
  id integer [primary key, increment]
  statement text [note: 'البيان']
  amount decimal
  morph_fund_id integer [note: 'مصروف شركة، مصروف عمال، أمانات، مشاريع، إلخ']
  created_at timestamp
  is_posted boolean [default: true, note: 'false تعني دفعة غير مرحلة تحول لصندوق المبالغ غير المرحلية']
  employee_id integer [null, note: 'آمر التأكيد بالإستلام من قبل الإدارة']
  received_by integer [null, note: 'تحديد من قام باستلامها']

}


Table CompanyFund {
  id integer [primary key, increment]
  name string
  created_at timestamp
  updated_at timestamp

}



// --- نظام الفواتير والمواد ---


Table Invoices {
  id integer [primary key, increment]
  item_id integer [primary key, increment]
  expensses_id integer [note: 'تحديد المصروف لأي ورشة']
  supplier_id integer [note: 'المورد من جدول المستخدمين']
  target_account_id integer [note: 'صندوق الهدف المرتبط بالفاتورة']
  invoice_number varchar [unique]
  date timestamp
  discount decimal [default: 0]
  final_total decimal [note: 'المجموع النهائي بعد الحسم']
  is_posted boolean [default: true , note: "تحديد الترحيل"]
  is_visible_to_client boolean [default: true , note: "إظهار الفاتورة للعميل"]
}

Table Invoice_Items {
  id integer [primary key, increment]
  invoice_id integer
  item_description text [note: 'وصف المادة']
  unit varchar [note: 'الواحدة']
  quantity decimal
  unit_price decimal
  total_price decimal [note: 'الإجمالي قبل الحسم']
} 
 