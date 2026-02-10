<div align="center">

# 💰 PayEase

**Indian Payroll Management System**

A modern, full-stack payroll solution built for Indian businesses — handling employee management, salary calculations with PF/ESI/PT compliance, payslip generation, and more.

[![Built with React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

</div>

---

## ✨ Features

### 👥 Employee Management
- Full CRUD operations — add, edit, view, and soft-delete employees
- Search & filter by department, status, or name
- Bulk import via Excel (Phase 2)
- PAN validation, Aadhaar (last 4 digits), bank details

### 💵 Salary Calculation Engine
- **Indian tax compliance** — PF, ESI, Professional Tax auto-calculated
- Configurable salary structures (Basic, HRA, DA, Special Allowance)
- CTC-to-take-home breakdown
- Monthly payroll run management with approval workflow

### 📄 Payslip Generation
- PDF payslip generation using jsPDF
- Password-protected documents (employee DOB)
- Batch generation for entire payroll runs
- Company branding (logo, address)

### 📊 Dashboard & Calendar
- Real-time employee & payroll statistics
- Payroll calendar with key dates
- Status badges and activity tracking

### 🔐 Authentication & Security
- Supabase Auth (email/password)
- Row-Level Security (RLS) on all tables
- Company-scoped data isolation
- Guided onboarding wizard for new companies

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Styling** | CSS custom properties, component-scoped CSS |
| **Backend** | Supabase (PostgreSQL, Auth, RLS) |
| **PDF Engine** | jsPDF |
| **Routing** | React Router DOM v6 |
| **Package Manager** | npm with workspaces (monorepo) |

---

## 📁 Project Structure

```
PayEase/
├── apps/
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── components/     # Feature-grouped components
│       │   │   ├── auth/       # Login, Signup
│       │   │   ├── dashboard/  # Dashboard, PayrollCalendar
│       │   │   ├── employees/  # EmployeeForm, EmployeeList, EmployeeDetail
│       │   │   ├── onboarding/ # OnboardingWizard
│       │   │   ├── payroll/    # SalaryCalculator, PayrollRunManager
│       │   │   └── payslips/   # PayslipManager
│       │   ├── contexts/       # AuthContext (Supabase Auth)
│       │   ├── lib/            # API helpers (employees, payroll, documents)
│       │   ├── styles/         # Component CSS + global design tokens
│       │   └── types/          # TypeScript type definitions
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
├── directives/                 # SOPs (deploy, migrations, dev workflow)
├── execution/                  # Automation scripts (setup, deps check)
├── phases/                     # Project roadmap & phase tracking
├── skills/                     # Reusable skill modules
│   ├── compliance-engine/      # PF/ESI/PT calculation rules
│   ├── document-generator/     # PDF payslip generation
│   └── project-scaffold/       # Project bootstrapping
├── package.json                # Root monorepo config
└── .env.example                # Environment variable template
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/Sajal133/PayEase.git
cd PayEase
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Database

Run the SQL migrations in your Supabase SQL editor to create the required tables:
- `companies`
- `employees`
- `salary_structures`
- `payroll_runs`
- `payslips`

> See `phases/phase_1.md` for the complete schema details.

### 4. Run the App

```bash
npm run dev:web
```

The app will be available at **http://localhost:3000**

---

## 📸 Pages

| Page | Route | Description |
|------|-------|-------------|
| Login/Signup | `/auth/login`, `/auth/signup` | Supabase email auth |
| Dashboard | `/dashboard` | Employee stats, payroll calendar |
| Employees | `/employees` | List, add, edit, view employees |
| Payroll | `/payroll` | Manage payroll runs |
| Salary Calculator | `/salary-calculator` | CTC → take-home breakdown |
| Payslips | `/payslips/:runId` | Generate & download PDFs |
| Calendar | `/calendar` | Payroll dates & deadlines |
| Onboarding | `/onboarding` | Company setup wizard |

---

## 🗺️ Roadmap

### Phase 1 ✅ — MVP (Current)
- [x] Agentic project foundations
- [x] Supabase backend + Auth
- [x] Employee CRUD
- [x] Salary calculation engine (PF/ESI/PT)
- [x] Payslip PDF generation
- [x] Dashboard & calendar
- [x] Onboarding wizard

### Phase 2 🔜 — Compliance & Integrations
- [ ] Excel bulk import wizard
- [ ] PF/ESI monthly return reports
- [ ] TDS calculation engine
- [ ] Compliance dashboard
- [ ] Email payslip distribution

### Phase 3 📋 — Advanced Features
- [ ] Leave & attendance management
- [ ] Reimbursement workflows
- [ ] Multi-branch support
- [ ] Audit trail & logs

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for Indian businesses**

</div>
