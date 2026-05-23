import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  BookOpen,
  Bot,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Edit3,
  Library,
  LogIn,
  Moon,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserRound,
  Users
} from 'lucide-react';
import './styles.css';

const finePerDay = 5;
const allowedDays = 7;
const today = new Date('2026-05-23T10:00:00');

const seedBooks = [
  { id: 'BK-1001', title: 'Python Basics', author: 'A. Sharma', genre: 'Programming', department: 'Computer Science', popularity: 94, copies: 5, issued: 2 },
  { id: 'BK-1002', title: 'Data Science Intro', author: 'N. Patel', genre: 'Data Science', department: 'Computer Science', popularity: 88, copies: 3, issued: 1 },
  { id: 'BK-1003', title: 'Machine Learning Essentials', author: 'R. Mehta', genre: 'AI', department: 'Computer Science', popularity: 97, copies: 4, issued: 1 },
  { id: 'BK-1004', title: 'Deep Learning Guide', author: 'S. Iyer', genre: 'AI', department: 'Computer Science', popularity: 91, copies: 2, issued: 0 },
  { id: 'BK-1005', title: 'Circuit Theory Orbit', author: 'M. Rao', genre: 'Electronics', department: 'Electronics', popularity: 72, copies: 3, issued: 1 },
  { id: 'BK-1006', title: 'Business Analytics', author: 'L. Gupta', genre: 'Management', department: 'Business', popularity: 84, copies: 5, issued: 1 },
  { id: 'BK-1007', title: 'Quantum Computing Primer', author: 'T. Bose', genre: 'Physics', department: 'Science', popularity: 79, copies: 2, issued: 0 },
  { id: 'BK-1008', title: 'Database Systems', author: 'K. Nair', genre: 'Programming', department: 'Computer Science', popularity: 86, copies: 4, issued: 1 }
];

const seedStudents = [
  { id: 'STU-2401', name: 'Maya Singh', email: 'maya@lms.dev', department: 'Computer Science', password: 'maya123' },
  { id: 'STU-2402', name: 'Arjun Rao', email: 'arjun@lms.dev', department: 'Electronics', password: 'arjun123' },
  { id: 'STU-2403', name: 'Zara Khan', email: 'zara@lms.dev', department: 'Business', password: 'zara123' }
];

const seedIssues = [
  { id: 'ISS-001', studentId: 'STU-2401', bookId: 'BK-1001', issueDate: '2026-05-05', dueDate: '2026-05-12', returnDate: null },
  { id: 'ISS-002', studentId: 'STU-2401', bookId: 'BK-1002', issueDate: '2026-05-17', dueDate: '2026-05-24', returnDate: null },
  { id: 'ISS-003', studentId: 'STU-2402', bookId: 'BK-1005', issueDate: '2026-05-01', dueDate: '2026-05-08', returnDate: null },
  { id: 'ISS-004', studentId: 'STU-2403', bookId: 'BK-1006', issueDate: '2026-05-10', dueDate: '2026-05-17', returnDate: '2026-05-20' }
];

function daysBetween(dateA, dateB) {
  const start = new Date(dateA);
  const end = new Date(dateB);
  return Math.max(0, Math.ceil((end - start) / 86400000));
}

function dueDateFromNow() {
  const due = new Date(today);
  due.setDate(due.getDate() + allowedDays);
  return due.toISOString().slice(0, 10);
}

function calcFine(issue) {
  const compareDate = issue.returnDate || today.toISOString().slice(0, 10);
  const lateDays = daysBetween(issue.dueDate, compareDate);
  return { lateDays, amount: lateDays * finePerDay };
}

function useLocalState(key, fallback) {
  const [value, setValue] = useState(() => {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : fallback;
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue];
}

function QRImage({ value }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: 128, color: { dark: '#0b1020', light: '#d9fbff' } }).then(setSrc);
  }, [value]);
  return src ? <img className="qr-image" src={src} alt={`QR for ${value}`} /> : <div className="qr-image skeleton" />;
}

function Scanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 8, qrbox: { width: 220, height: 220 } }, false);
    scanner.render(
      (decoded) => {
        onScan(decoded);
        scanner.clear();
      },
      () => {}
    );
    return () => scanner.clear().catch(() => {});
  }, [onScan]);
  return <div id="qr-reader" className="scanner" />;
}

function App() {
  const [books, setBooks] = useLocalState('lms.books', seedBooks);
  const [students, setStudents] = useLocalState('lms.students', seedStudents);
  const [issues, setIssues] = useLocalState('lms.issues', seedIssues);
  const [role, setRole] = useState('student');
  const [studentId, setStudentId] = useState('STU-2401');
  const [query, setQuery] = useState('');
  const [scannerMode, setScannerMode] = useState(false);
  const [scanStudent, setScanStudent] = useState('');
  const [scanBook, setScanBook] = useState('');
  const activeStudent = students.find((student) => student.id === studentId) || students[0];

  const activeIssues = issues.filter((issue) => !issue.returnDate);
  const overdueIssues = activeIssues.filter((issue) => calcFine(issue).lateDays > 0);
  const issuedForStudent = issues.filter((issue) => issue.studentId === activeStudent.id);
  const filteredBooks = books.filter((book) => `${book.title} ${book.author} ${book.genre}`.toLowerCase().includes(query.toLowerCase()));

  const recommendations = useMemo(() => {
    const borrowedIds = new Set(issuedForStudent.map((issue) => issue.bookId));
    const borrowedBooks = books.filter((book) => borrowedIds.has(book.id));
    const genres = new Set(borrowedBooks.map((book) => book.genre));
    return books
      .filter((book) => !borrowedIds.has(book.id))
      .map((book) => ({
        ...book,
        score: (genres.has(book.genre) ? 45 : 0) + (book.department === activeStudent.department ? 25 : 0) + book.popularity / 3
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [activeStudent.department, books, issuedForStudent]);

  const analytics = [
    { label: 'Jan', issues: 22, returns: 18 },
    { label: 'Feb', issues: 28, returns: 23 },
    { label: 'Mar', issues: 34, returns: 29 },
    { label: 'Apr', issues: 39, returns: 35 },
    { label: 'May', issues: issues.length + 32, returns: issues.filter((issue) => issue.returnDate).length + 27 }
  ];

  const mostBorrowed = books
    .map((book) => ({ name: book.title.replace(' Essentials', ''), borrowed: issues.filter((issue) => issue.bookId === book.id).length + book.issued }))
    .sort((a, b) => b.borrowed - a.borrowed)
    .slice(0, 5);

  function issueBook(bookId, selectedStudentId = activeStudent.id) {
    const book = books.find((item) => item.id === bookId);
    if (!book || book.issued >= book.copies) return;
    setIssues((current) => [
      ...current,
      {
        id: `ISS-${Date.now()}`,
        studentId: selectedStudentId,
        bookId,
        issueDate: today.toISOString().slice(0, 10),
        dueDate: dueDateFromNow(),
        returnDate: null
      }
    ]);
    setBooks((current) => current.map((item) => (item.id === bookId ? { ...item, issued: item.issued + 1 } : item)));
  }

  function returnBook(issueId) {
    const issue = issues.find((item) => item.id === issueId);
    setIssues((current) => current.map((item) => (item.id === issueId ? { ...item, returnDate: today.toISOString().slice(0, 10) } : item)));
    if (issue) setBooks((current) => current.map((book) => (book.id === issue.bookId ? { ...book, issued: Math.max(0, book.issued - 1) } : book)));
  }

  function addBook() {
    const nextId = `BK-${1001 + books.length}`;
    setBooks((current) => [
      ...current,
      { id: nextId, title: 'New Orbital Title', author: 'Library Team', genre: 'General', department: 'Science', popularity: 50, copies: 1, issued: 0 }
    ]);
  }

  function updateBook(bookId, patch) {
    setBooks((current) => current.map((book) => (book.id === bookId ? { ...book, ...patch } : book)));
  }

  function deleteBook(bookId) {
    setBooks((current) => current.filter((book) => book.id !== bookId));
    setIssues((current) => current.filter((issue) => issue.bookId !== bookId));
  }

  function handleScan(value) {
    if (value.startsWith('STU-')) setScanStudent(value);
    if (value.startsWith('BK-')) setScanBook(value);
  }

  function completeQrIssue() {
    if (scanStudent && scanBook) {
      issueBook(scanBook, scanStudent);
      setScanStudent('');
      setScanBook('');
    }
  }

  return (
    <main className="app-shell">
      <aside className="side-rail">
        <div className="brand-lockup">
          <div className="brand-mark"><Library size={26} /></div>
          <div>
            <strong>LMS 2.0</strong>
            <span>Orbital Library Core</span>
          </div>
        </div>
        <nav className="role-switch" aria-label="Panel switcher">
          <button className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}><UserRound size={18} /> Student</button>
          <button className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}><Shield size={18} /> Admin</button>
        </nav>
        <div className="mission-card">
          <Moon size={18} />
          <span>Dark mode dashboard online</span>
        </div>
      </aside>

      <section className="main-deck">
        <header className="topbar">
          <div>
            <p className="eyebrow">Library Management System 2.0</p>
            <h1>{role === 'student' ? 'Student Command Panel' : 'Admin Control Bridge'}</h1>
          </div>
          <div className="login-strip">
            {role === 'student' ? (
              <>
                <LogIn size={17} />
                <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                </select>
              </>
            ) : (
              <><Shield size={17} /> Admin signed in</>
            )}
          </div>
        </header>

        <Dashboard books={books} students={students} overdueIssues={overdueIssues} mostBorrowed={mostBorrowed} analytics={analytics} />

        {role === 'student' ? (
          <StudentPanel
            activeStudent={activeStudent}
            books={filteredBooks}
            issues={issuedForStudent}
            query={query}
            setQuery={setQuery}
            issueBook={issueBook}
            returnBook={returnBook}
            recommendations={recommendations}
          />
        ) : (
          <AdminPanel
            books={books}
            students={students}
            issues={issues}
            addBook={addBook}
            updateBook={updateBook}
            deleteBook={deleteBook}
            returnBook={returnBook}
            scannerMode={scannerMode}
            setScannerMode={setScannerMode}
            scanStudent={scanStudent}
            scanBook={scanBook}
            handleScan={handleScan}
            completeQrIssue={completeQrIssue}
          />
        )}
      </section>
    </main>
  );
}

function Dashboard({ books, students, overdueIssues, mostBorrowed, analytics }) {
  const totalBooks = books.reduce((sum, book) => sum + book.copies, 0);
  return (
    <section className="metrics-grid">
      <Metric icon={<BookOpen />} label="Total Books" value={totalBooks} tone="cyan" />
      <Metric icon={<Users />} label="Active Students" value={students.length} tone="lime" />
      <Metric icon={<CircleDollarSign />} label="Overdue Books" value={overdueIssues.length} tone="rose" />
      <div className="chart-panel wide">
        <div className="panel-title"><Sparkles size={18} /> Monthly Activity</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={analytics}>
            <defs>
              <linearGradient id="activity" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#47e8ff" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#47e8ff" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#20304d" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#89a1c9" />
            <YAxis stroke="#89a1c9" />
            <Tooltip contentStyle={{ background: '#101a31', border: '1px solid #294166', color: '#e9f6ff' }} />
            <Area type="monotone" dataKey="issues" stroke="#47e8ff" fill="url(#activity)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-panel">
        <div className="panel-title"><BookOpen size={18} /> Most Borrowed</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={mostBorrowed}>
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip contentStyle={{ background: '#101a31', border: '1px solid #294166', color: '#e9f6ff' }} />
            <Bar dataKey="borrowed" fill="#9cff6e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Metric({ icon, label, value, tone }) {
  return (
    <div className={`metric ${tone}`}>
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function StudentPanel({ activeStudent, books, issues, query, setQuery, issueBook, returnBook, recommendations }) {
  return (
    <section className="workspace-grid">
      <div className="panel span-2">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Search Books</p>
            <h2>Catalog Radar</h2>
          </div>
          <label className="searchbox">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, author, genre" />
          </label>
        </div>
        <div className="book-grid">
          {books.map((book) => (
            <BookCard key={book.id} book={book} actionLabel="Borrow" actionIcon={<ChevronRight size={16} />} onAction={() => issueBook(book.id)} />
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head compact">
          <div>
            <p className="eyebrow">{activeStudent.id}</p>
            <h2>{activeStudent.name}</h2>
          </div>
          <QRImage value={activeStudent.id} />
        </div>
        <div className="status-stack">
          {issues.map((issue) => <IssueRow key={issue.id} issue={issue} onReturn={() => returnBook(issue.id)} />)}
        </div>
      </div>

      <div className="panel span-3">
        <div className="panel-title"><Bot size={18} /> AI Book Recommendations</div>
        <div className="recommendation-row">
          {recommendations.map((book) => (
            <div className="recommendation" key={book.id}>
              <Sparkles size={18} />
              <strong>{book.title}</strong>
              <span>{book.genre} · {Math.round(book.score)} match score</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IssueRow({ issue, onReturn }) {
  const fine = calcFine(issue);
  return (
    <div className="issue-row">
      <div>
        <strong>{issue.bookId}</strong>
        <span>Due {issue.dueDate}</span>
      </div>
      <div className={fine.amount ? 'fine danger' : 'fine'}>₹{fine.amount}</div>
      {!issue.returnDate && <button className="icon-button" onClick={onReturn} title="Return book"><RotateCcw size={16} /></button>}
    </div>
  );
}

function AdminPanel({ books, students, issues, addBook, updateBook, deleteBook, scannerMode, setScannerMode, scanStudent, scanBook, handleScan, completeQrIssue }) {
  return (
    <section className="workspace-grid">
      <div className="panel span-2">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Inventory</p>
            <h2>Book Operations</h2>
          </div>
          <button className="primary" onClick={addBook}><Plus size={17} /> Add Book</button>
        </div>
        <div className="admin-table">
          {books.map((book) => (
            <div className="admin-row" key={book.id}>
              <QRImage value={book.id} />
              <input value={book.title} onChange={(event) => updateBook(book.id, { title: event.target.value })} />
              <input value={book.genre} onChange={(event) => updateBook(book.id, { genre: event.target.value })} />
              <span>{book.issued}/{book.copies}</span>
              <button className="icon-button" title="Edit book"><Edit3 size={15} /></button>
              <button className="icon-button danger" onClick={() => deleteBook(book.id)} title="Delete book"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">QR Issue</p>
            <h2>Scanner Dock</h2>
          </div>
          <button className="icon-button" onClick={() => setScannerMode(!scannerMode)} title="Toggle scanner"><Camera size={17} /></button>
        </div>
        {scannerMode ? <Scanner onScan={handleScan} /> : <div className="scanner-placeholder"><QrCode size={52} /> Camera scanner standby</div>}
        <div className="scan-status">
          <span className={scanStudent ? 'ok' : ''}><CheckCircle2 size={16} /> {scanStudent || 'Scan student ID'}</span>
          <span className={scanBook ? 'ok' : ''}><CheckCircle2 size={16} /> {scanBook || 'Scan book QR'}</span>
        </div>
        <button className="primary full" disabled={!scanStudent || !scanBook} onClick={completeQrIssue}>Issue Book Instantly</button>
      </div>

      <div className="panel">
        <div className="panel-title"><Users size={18} /> Students</div>
        <div className="status-stack">
          {students.map((student) => (
            <div className="student-chip" key={student.id}>
              <QRImage value={student.id} />
              <div>
                <strong>{student.name}</strong>
                <span>{student.department}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel span-2">
        <div className="panel-title"><CircleDollarSign size={18} /> Overdue Report</div>
        <div className="report-list">
          {issues.filter((issue) => !issue.returnDate && calcFine(issue).amount > 0).map((issue) => (
            <div className="report-row" key={issue.id}>
              <span>{issue.studentId}</span>
              <strong>{issue.bookId}</strong>
              <span>{calcFine(issue).lateDays} late days</span>
              <b>₹{calcFine(issue).amount}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BookCard({ book, actionLabel, actionIcon, onAction }) {
  const available = book.copies - book.issued;
  return (
    <article className="book-card">
      <div className="book-beam" />
      <div className="book-meta">
        <span>{book.id}</span>
        <QRImage value={book.id} />
      </div>
      <h3>{book.title}</h3>
      <p>{book.author}</p>
      <div className="book-tags">
        <span>{book.genre}</span>
        <span>{available} available</span>
      </div>
      <button className="secondary" onClick={onAction} disabled={available <= 0}>{actionLabel} {actionIcon}</button>
    </article>
  );
}

createRoot(document.getElementById('root')).render(<App />);
