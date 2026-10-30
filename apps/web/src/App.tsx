import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  FileText,
  Filter,
  Globe2,
  GraduationCap,
  Heart,
  Layers3,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import type { MatchResult, Opportunity } from "@dreamopps/shared";

const demo: Opportunity[] = [
  {
    id: "demo-1",
    slug: "future-makers-scholarship",
    title: "Future Makers Scholarship",
    provider: "Northstar Foundation",
    category: "Scholarship",
    location: "Global · 42 countries",
    format: "Hybrid",
    funding: "Up to $12,000",
    deadline: "2026-11-30",
    level: ["Undergraduate", "Postgraduate"],
    field: ["Technology", "Business", "Design"],
    description:
      "A demonstration listing for students building practical solutions in their communities. This sample is fictional and included to show how DreamOpps presents opportunity details.",
    source: "Demonstration record — no external source",
    checkedAt: "2026-10-25",
    status: "published",
    demo: true,
  },
  {
    id: "demo-2",
    slug: "climate-data-internship",
    title: "Climate Data Research Internship",
    provider: "Open Earth Lab",
    category: "Internship",
    location: "Remote · worldwide",
    format: "Remote",
    funding: "Paid · $2,400/month",
    deadline: "2026-12-12",
    level: ["Undergraduate", "Postgraduate"],
    field: ["Environment", "Data science"],
    description:
      "A fictional demonstration placement exploring climate datasets and open research tools with a distributed team.",
    source: "Demonstration record — no external source",
    checkedAt: "2026-10-25",
    status: "published",
    demo: true,
  },
  {
    id: "demo-3",
    slug: "global-health-fellows",
    title: "Global Health Equity Fellows",
    provider: "Public Health Futures",
    category: "Fellowship",
    location: "Kenya, Ghana, Rwanda",
    format: "In person",
    funding: "Stipend + travel support",
    deadline: "2027-01-08",
    level: ["Postgraduate"],
    field: ["Public health", "Policy"],
    description:
      "Fictional example fellowship for emerging public health practitioners and researchers.",
    source: "Demonstration record — no external source",
    checkedAt: "2026-10-25",
    status: "published",
    demo: true,
  },
  {
    id: "demo-4",
    slug: "student-innovation-challenge",
    title: "Student Innovation Challenge",
    provider: "Bright Ideas Network",
    category: "Competition",
    location: "Global",
    format: "Remote",
    funding: "$5,000 project grant",
    deadline: "2026-11-15",
    level: ["Undergraduate", "Postgraduate"],
    field: ["Any field"],
    description:
      "Fictional sample competition showing how a clear next step and eligibility details could appear.",
    source: "Demonstration record — no external source",
    checkedAt: "2026-10-25",
    status: "published",
    demo: true,
  },
  {
    id: "demo-5",
    slug: "early-career-design-role",
    title: "Associate Product Designer",
    provider: "Common Ground Studio",
    category: "Graduate job",
    location: "London, UK",
    format: "Hybrid",
    funding: "Salary listed by provider",
    deadline: "2026-12-20",
    level: ["Graduate"],
    field: ["Design", "Technology"],
    description:
      "A fictional sample early-career role included for product demonstration only.",
    source: "Demonstration record — no external source",
    checkedAt: "2026-10-25",
    status: "published",
    demo: true,
  },
  {
    id: "demo-6",
    slug: "community-research-grant",
    title: "Community Research Seed Grant",
    provider: "Civic Research Collective",
    category: "Grant",
    location: "East Africa",
    format: "Hybrid",
    funding: "Up to $3,000",
    deadline: "2026-12-01",
    level: ["Undergraduate", "Postgraduate"],
    field: ["Social sciences", "Any field"],
    description:
      "Fictional demonstration grant supporting student-led local research projects.",
    source: "Demonstration record — no external source",
    checkedAt: "2026-10-25",
    status: "published",
    demo: true,
  },
];
const api = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
function readSaved() {
  try {
    return JSON.parse(
      localStorage.getItem("dreamopps:saved") || "[]",
    ) as string[];
  } catch {
    return [];
  }
}
type SessionUser = { id: string; email: string; name: string; role: string };
type StudentProfileDraft = {
  level?: string;
  field?: string;
  location?: string;
  nationality?: string;
  interests?: string;
};
const SESSION_EVENT = "dreamopps:session-change";
function useServerSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      fetch(`${api}/auth/me`, { credentials: "include" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (active) setUser(data?.user ?? null);
        })
        .catch(() => {
          if (active) setUser(null);
        });
    };
    refresh();
    window.addEventListener(SESSION_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(SESSION_EVENT, refresh);
    };
  }, []);
  return user;
}
function announceSessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}
function Logo() {
  return (
    <Link to="/" className="brand" aria-label="DreamOpps home">
      <span className="brand-mark">
        <Sparkles size={18} />
      </span>
      <span>
        dreamopps<span className="brand-light"> intelligence</span>
      </span>
    </Link>
  );
}
function Header() {
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const user = useServerSession();
  async function logout() {
    setLogoutError("");
    try {
      const response = await fetch(`${api}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok && response.status !== 401)
        throw new Error("Could not end your server session. Please retry.");
      [
        "dreamopps:user",
        "dreamopps:profile",
        "dreamopps:saved",
        "dreamopps:apps",
      ].forEach((key) => localStorage.removeItem(key));
      announceSessionChange();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Could not log out.",
      );
    }
  }
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Logo />
        <button
          className="mobile-toggle icon-button"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          className={open ? "main-nav open" : "main-nav"}
          aria-label="Main navigation"
        >
          <NavLink to="/opportunities">Explore opportunities</NavLink>
          <a href="/#how-it-works">How it works</a>
          <NavLink to="/about">About</NavLink>
          <span className="nav-actions">
            {user ? (
              <>
                <NavLink to="/dashboard">My space</NavLink>
                <button
                  className="button button-small button-outline"
                  onClick={logout}
                >
                  Log out
                </button>
                {logoutError && <span role="alert">{logoutError}</span>}
              </>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <Link className="button button-small" to="/signup">
                  Get started <ArrowRight size={15} />
                </Link>
              </>
            )}
          </span>
        </nav>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <Logo />
        <span>Find the next step that fits you.</span>
        <div>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/about">Methodology</Link>
        </div>
        <small>© 2026 DreamOpps Intelligence</small>
      </div>
    </footer>
  );
}
function Deadline({ date, timezone }: { date: string; timezone?: string }) {
  if (!date)
    return (
      <span className="deadline">
        <Clock3 size={14} /> Deadline not stated
      </span>
    );
  const d = new Date(date.length === 10 ? `${date}T23:59:00` : date);
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(date.length > 10
      ? {
          hour: "numeric",
          minute: "2-digit",
          ...(timezone ? { timeZone: timezone, timeZoneName: "short" } : {}),
        }
      : {}),
  };
  return (
    <span className="deadline">
      <Clock3 size={14} /> Closes{" "}
      {Number.isNaN(d.getTime())
        ? "Date unavailable"
        : d.toLocaleString(undefined, dateOptions)}
    </span>
  );
}
function Card({
  item,
  saved = false,
  toggle,
}: {
  item: Opportunity;
  saved?: boolean;
  toggle: (id: string) => void;
}) {
  return (
    <article className="opp-card">
      <div className="card-top">
        <span className="category-tag">{item.category}</span>
        <button
          className={saved ? "save-button saved" : "save-button"}
          onClick={() => toggle(item.id)}
          aria-label={saved ? "Remove saved opportunity" : "Save opportunity"}
        >
          <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <Link className="card-title" to={"/opportunities/" + item.slug}>
        {item.title}
        <ArrowUpRight size={17} />
      </Link>
      <div className="provider">{item.provider}</div>
      <p className="card-desc">{item.description}</p>
      <div className="card-facts">
        <span>
          <Globe2 size={15} />
          {item.location}
        </span>
        <span>
          <GraduationCap size={15} />
          {item.level.join(" · ")}
        </span>
        <span>
          <BriefcaseBusiness size={15} />
          {item.funding}
        </span>
      </div>
      <div className="card-bottom">
        <Deadline date={item.deadline} timezone={item.deadlineTimezone} />
        <span className="source-label">
          <ShieldCheck size={14} />{" "}
          {item.demo
            ? "Demo listing"
            : item.verificationStatus === "VERIFIED"
              ? "Verified"
              : item.verificationStatus === "IN_REVIEW"
                ? "Source reviewed"
                : "Not verified"}
        </span>
      </div>
    </article>
  );
}
function useOpportunities() {
  const [items, setItems] = useState<Opportunity[]>(demo);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`${api}/opportunities?limit=50`)
      .then((r) => {
        if (!r.ok) throw new Error("API unavailable");
        return r.json();
      })
      .then((data) => {
        if (active && data.items?.length) setItems(data.items);
      })
      .catch(() => {
        if (active)
          setError(
            "Showing clearly labelled sample listings. Connect the API and database to load published opportunities.",
          );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);
  return { items, loading, error };
}
function Home() {
  const { items } = useOpportunities();
  const user = useServerSession();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(readSaved());
  const [saveError, setSaveError] = useState("");
  async function toggleSaved(id: string) {
    if (!user) {
      navigate("/login");
      return;
    }
    const removing = saved.includes(id);
    try {
      const response = await fetch(`${api}/saved/${id}`, {
        method: removing ? "DELETE" : "PUT",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Unable to update your saved list.");
      const next = removing
        ? saved.filter((value) => value !== id)
        : [...saved, id];
      setSaved(next);
      localStorage.setItem("dreamopps:saved", JSON.stringify(next));
      setSaveError("");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save this opportunity.",
      );
    }
  }
  return (
    <>
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="pulse-dot" /> A clearer way to find what’s next
              </div>
              <h1>
                Your next opportunity
                <br />
                <span>starts with a match.</span>
              </h1>
              <p>
                Scholarships, internships, fellowships and more — organized
                around what matters to you, with the details to make your next
                move.
              </p>
              <div className="hero-actions">
                <Link className="button" to="/opportunities">
                  Explore opportunities <ArrowRight size={17} />
                </Link>
                <Link className="text-link" to="/signup">
                  Build my profile <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="hero-note">
                <ShieldCheck size={16} /> Clear source status. No made-up
                success stories.
              </div>
            </div>
            <div className="hero-art">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="hero-center">
                <div className="center-star">
                  <Sparkles size={31} />
                </div>
                <b>
                  Your potential,
                  <br />
                  in focus.
                </b>
                <small>OPPORTUNITY INTELLIGENCE</small>
              </div>
              <div className="float-card match-float">
                <span className="tiny-label">MATCHING, EXPLAINED</span>
                <div className="match-num">Your fit</div>
                <span className="green-line">
                  <i />
                </span>
                <small>See the factors and missing details</small>
              </div>
              <div className="float-card deadline-float">
                <span className="float-icon">
                  <Clock3 size={15} />
                </span>
                <span>
                  <b>Your next step</b>
                  <small>Check eligibility and source details</small>
                </span>
              </div>
              <div className="tiny-spark">✳</div>
            </div>
          </div>
        </section>
        <section className="trust-strip">
          <div className="container trust-inner">
            <span>FIND YOUR FIT ACROSS</span>
            <b>
              <GraduationCap /> Scholarships
            </b>
            <b>
              <BriefcaseBusiness /> Internships
            </b>
            <b>
              <Layers3 /> Fellowships
            </b>
            <b>
              <Target /> Competitions
            </b>
            <b>
              <Heart /> Grants & more
            </b>
          </div>
        </section>
        <section className="section container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                A head start, not another search tab
              </div>
              <h2>
                Good opportunities.
                <br />
                <span>Clear next steps.</span>
              </h2>
            </div>
            <Link className="text-link" to="/opportunities">
              Browse all opportunities <ArrowRight size={16} />
            </Link>
          </div>
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}
          <div className="opportunity-grid">
            {items.slice(0, 3).map((item) => (
              <Card
                key={item.id}
                item={item}
                saved={saved.includes(item.id)}
                toggle={toggleSaved}
              />
            ))}
          </div>
        </section>
        <section className="how-section" id="how-it-works">
          <div className="container">
            <div className="section-heading">
              <div>
                <div className="eyebrow">A little more signal</div>
                <h2>
                  From “maybe someday”
                  <br />
                  <span>to your next move.</span>
                </h2>
              </div>
              <p className="section-sub">
                We put the context around every opportunity where you can use
                it.
              </p>
            </div>
            <div className="steps-grid">
              <div className="step">
                <span>01</span>
                <Compass />
                <h3>Discover with direction</h3>
                <p>
                  Filter by what you study, where you can apply from, and what
                  you want to do.
                </p>
              </div>
              <div className="step">
                <span>02</span>
                <Sparkles />
                <h3>See why it fits</h3>
                <p>
                  Understand matching factors, missing profile details, and
                  possible eligibility conflicts.
                </p>
              </div>
              <div className="step">
                <span>03</span>
                <Check />
                <h3>Keep the next step close</h3>
                <p>
                  Save the right opportunities and keep your application
                  progress in one place.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="closing-cta">
          <div className="container cta-inner">
            <div>
              <span className="eyebrow">Your next chapter is out there</span>
              <h2>Let’s find the door.</h2>
            </div>
            <Link className="button button-light" to="/signup">
              Create your free profile <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
function Discovery() {
  const { items, loading, error } = useOpportunities();
  const user = useServerSession();
  const userId = user?.id;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [cat, setCat] = useState(params.get("category") || "");
  const [format, setFormat] = useState("");
  const [level, setLevel] = useState("");
  const [country, setCountry] = useState("");
  const [field, setField] = useState("");
  const [funding, setFunding] = useState("");
  const [deadlineOnly, setDeadlineOnly] = useState(false);
  const [saved, setSaved] = useState(readSaved());
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("deadline");
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    if (!userId) return;
    fetch(`${api}/saved`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.items) {
          const next = data.items.map(
            (item: { opportunityId: string }) => item.opportunityId,
          );
          setSaved(next);
          localStorage.setItem("dreamopps:saved", JSON.stringify(next));
        }
      })
      .catch(() =>
        setSaveError("Could not load saved opportunities from your account."),
      );
  }, [userId]);
  const filtered = useMemo(
    () =>
      items
        .filter(
          (x) =>
            (!query ||
              `${x.title} ${x.provider} ${x.description} ${x.field.join(" ")}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (!cat || x.category === cat) &&
            (!format || x.format === format) &&
            (!level ||
              x.level.some((v) => v.toLowerCase() === level.toLowerCase())) &&
            (!country ||
              x.location.toLowerCase().includes(country.toLowerCase())) &&
            (!field ||
              x.field.some((v) =>
                v.toLowerCase().includes(field.toLowerCase()),
              )) &&
            (!funding ||
              x.funding.toLowerCase().includes(funding.toLowerCase())) &&
            (!deadlineOnly ||
              !x.deadline ||
              new Date(x.deadline + "T00:00:00") >=
                new Date(new Date().toDateString())),
        )
        .sort((a, b) =>
          sort === "title"
            ? a.title.localeCompare(b.title)
            : (a.deadline || "9999-12-31").localeCompare(
                b.deadline || "9999-12-31",
              ),
        ),
    [
      items,
      query,
      cat,
      format,
      level,
      country,
      field,
      funding,
      deadlineOnly,
      sort,
    ],
  );
  const perPage = 6;
  async function toggle(id: string) {
    if (!user) {
      navigate("/login");
      return;
    }
    const removing = saved.includes(id);
    try {
      const response = await fetch(`${api}/saved/${id}`, {
        method: removing ? "DELETE" : "PUT",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Unable to update your saved list.");
      const next = removing
        ? saved.filter((value) => value !== id)
        : [...saved, id];
      setSaved(next);
      localStorage.setItem("dreamopps:saved", JSON.stringify(next));
      setSaveError("");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save this opportunity.",
      );
    }
  }
  return (
    <>
      <main className="page-main container">
        <div className="page-intro">
          <div className="eyebrow">Your next move is closer than you think</div>
          <h1>
            Find your <span>opportunity.</span>
          </h1>
          <p>
            Explore possibilities that meet you where you are — and show you
            where you could go.
          </p>
        </div>
        <div className="discover-layout">
          <aside className="filter-panel">
            <div className="filter-title">
              <span>
                <Filter size={17} /> Refine your search
              </span>
              <button
                onClick={() => {
                  setCat("");
                  setFormat("");
                  setQuery("");
                }}
              >
                Clear
              </button>
            </div>
            <label className="field-label">
              Opportunity type
              <select value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="">All types</option>
                {[
                  "Scholarship",
                  "Internship",
                  "Graduate job",
                  "Fellowship",
                  "Competition",
                  "Grant",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Format
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="">Any format</option>
                {["Remote", "Hybrid", "In person"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Study level
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">Any study level</option>
                <option>Undergraduate</option>
                <option>Postgraduate</option>
                <option>Graduate</option>
              </select>
            </label>
            <label className="field-label">
              Country or location
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Kenya or remote"
              />
            </label>
            <label className="field-label">
              Field of study
              <input
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="e.g. Design"
              />
            </label>
            <label className="field-label">
              Funding type
              <select
                value={funding}
                onChange={(e) => setFunding(e.target.value)}
              >
                <option value="">Any funding</option>
                <option value="fully funded">Fully funded</option>
                <option value="paid">Paid</option>
                <option value="grant">Grant</option>
              </select>
            </label>
            <label className="field-label">
              Deadline
              <select
                value={deadlineOnly ? "open" : "any"}
                onChange={(e) => setDeadlineOnly(e.target.value === "open")}
              >
                <option value="any">Any deadline</option>
                <option value="open">Open opportunities</option>
              </select>
            </label>
            <div className="filter-note">
              <ShieldCheck size={16} />
              <span>
                Source status is shown on every listing. Demo items are
                fictional.
              </span>
            </div>
          </aside>
          <div className="results-column">
            <div className="search-row">
              <div className="search-box">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by keyword, provider or field"
                  aria-label="Search opportunities"
                />
              </div>
              <label className="sort-select">
                Sort by{" "}
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="deadline">Deadline</option>
                  <option value="title">Title</option>
                </select>
                <ChevronDown size={15} />
              </label>
            </div>
            <div className="results-count">
              {filtered.length} opportunities <span>·</span> Global discovery
            </div>
            {(error || saveError) && (
              <div className="notice">
                <CircleHelp size={16} />
                {saveError || error}
              </div>
            )}
            {loading && (
              <div className="loading-state">Finding opportunities…</div>
            )}
            {filtered.length === 0 ? (
              <div className="empty-state">
                <Search size={28} />
                <h3>No opportunities found</h3>
                <p>
                  Try a broader search or clear a filter to see more
                  possibilities.
                </p>
              </div>
            ) : (
              <div className="opportunity-grid">
                {filtered
                  .slice((page - 1) * perPage, page * perPage)
                  .map((item) => (
                    <Card
                      key={item.id}
                      item={item}
                      saved={saved.includes(item.id)}
                      toggle={toggle}
                    />
                  ))}
              </div>
            )}
            <div className="pagination">
              <span>
                Page {page} of{" "}
                {Math.max(1, Math.ceil(filtered.length / perPage))}
              </span>
              <button
                className="button button-outline button-small"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ArrowDown className="up-arrow" size={14} /> Previous
              </button>
              <button
                className="button button-outline button-small"
                disabled={page >= Math.ceil(filtered.length / perPage)}
                onClick={() => setPage(page + 1)}
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
function Detail() {
  const { slug = "" } = useParams();
  const { items } = useOpportunities();
  const user = useServerSession();
  const navigate = useNavigate();
  const item = items.find((x) => x.slug === slug);
  const [saved, setSaved] = useState(readSaved());
  const [saveError, setSaveError] = useState("");
  if (!item)
    return (
      <main className="container page-main">
        <div className="empty-state">
          <h2>Opportunity not found</h2>
          <p>This listing may have expired or moved.</p>
          <Link className="button" to="/opportunities">
            Back to discovery
          </Link>
        </div>
      </main>
    );
  const toggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const removing = saved.includes(item.id);
    try {
      const response = await fetch(`${api}/saved/${item.id}`, {
        method: removing ? "DELETE" : "PUT",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Unable to update your saved list.");
      const next = removing
        ? saved.filter((value) => value !== item.id)
        : [...saved, item.id];
      setSaved(next);
      localStorage.setItem("dreamopps:saved", JSON.stringify(next));
      setSaveError("");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save this opportunity.",
      );
    }
  };
  return (
    <>
      <main className="container page-main detail-page">
        <Link className="back-link" to="/opportunities">
          ← Back to opportunities
        </Link>
        <div className="detail-layout">
          <article>
            <span className="category-tag">{item.category}</span>
            <h1>{item.title}</h1>
            <p className="detail-provider">
              {item.provider}{" "}
              {item.demo && (
                <>
                  <span>·</span> Demonstration
                </>
              )}
            </p>
            <div className="detail-actions">
              <button className="button" onClick={toggle}>
                {saved.includes(item.id) ? (
                  <Check size={17} />
                ) : (
                  <Bookmark size={17} />
                )}{" "}
                {saved.includes(item.id) ? "Saved" : "Save opportunity"}
              </button>
              {item.demo ? (
                <button
                  className="button button-outline"
                  disabled
                  title="Demonstration records have no real application page."
                >
                  Demo listing · no application link
                </button>
              ) : item.applicationUrl ? (
                <a
                  className="button button-outline"
                  href={item.applicationUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit application page <ArrowUpRight size={16} />
                </a>
              ) : null}
            </div>
            {saveError && (
              <p className="form-error" role="alert">
                {saveError}
              </p>
            )}
            <section className="detail-section">
              <h2>About this opportunity</h2>
              <p>{item.description}</p>
              <p>
                Sample opportunity records demonstrate the product experience
                and are not genuine openings. Always check the original provider
                for current information before applying.
              </p>
            </section>
            <section className="detail-section">
              <h2>Eligibility at a glance</h2>
              <div className="detail-facts">
                <div>
                  <span>Study level</span>
                  <b>{item.level.join(", ")}</b>
                </div>
                <div>
                  <span>Field of study</span>
                  <b>{item.field.join(", ")}</b>
                </div>
                <div>
                  <span>Where to apply from</span>
                  <b>{item.location}</b>
                </div>
                <div>
                  <span>Format</span>
                  <b>{item.format}</b>
                </div>
              </div>
              <div className="notice">
                <CircleHelp size={17} /> Eligibility has not been checked
                against a student profile for this demo listing.
              </div>
            </section>
            <section className="detail-section">
              <h2>Application requirements</h2>
              <p>
                Requirements and documents are not specified in this
                demonstration record.
              </p>
            </section>
          </article>
          <aside className="detail-sidebar">
            <div className="sidebar-card">
              <div className="eyebrow">Opportunity snapshot</div>
              <div className="snapshot-row">
                <span>Funding</span>
                <b>{item.funding}</b>
              </div>
              <div className="snapshot-row">
                <span>Deadline</span>
                <b>
                  <Deadline
                    date={item.deadline}
                    timezone={item.deadlineTimezone}
                  />
                </b>
              </div>
              <div className="snapshot-row">
                <span>Source status</span>
                <b>
                  <span className="status-pill demo-pill">
                    {item.demo
                      ? "Demonstration"
                      : item.verificationStatus || "UNCHECKED"}
                  </span>
                </b>
              </div>
              <div className="snapshot-row">
                <span>Last checked</span>
                <b>{item.checkedAt}</b>
              </div>
              <hr />
              <p className="source-text">
                <ShieldCheck size={16} />
                {item.source}
              </p>
              <p className="small-note">
                A credible source and a current, verified opportunity are
                different things. This demo record has no live source.
              </p>
            </div>
            <div className="sidebar-card next-action">
              <Sparkles />
              <h3>Your next step</h3>
              <p>
                Complete your profile to see a personalized match breakdown.
              </p>
              <Link to="/signup">
                Create your profile <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
function Auth({ signup = false }: { signup?: boolean }) {
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch(`${api}/auth/${signup ? "register" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error?.message || "Could not sign in.");
      [
        "dreamopps:user",
        "dreamopps:profile",
        "dreamopps:saved",
        "dreamopps:apps",
      ].forEach((key) => localStorage.removeItem(key));
      announceSessionChange();
      nav("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the API. Start the API and database, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <main className="auth-wrap">
        <div className="auth-card">
          <div className="auth-symbol">
            <Sparkles />
          </div>
          <div className="eyebrow">
            {signup ? "Make room for what’s next" : "Welcome back"}
          </div>
          <h1>{signup ? "Create your account" : "Log in to DreamOpps"}</h1>
          <p>
            {signup
              ? "One profile, opportunities that make more sense."
              : "Pick up right where you left off."}
          </p>
          <form onSubmit={submit}>
            {signup && (
              <label className="field-label">
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  placeholder="Alex Morgan"
                />
              </label>
            )}
            <label className="field-label">
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@university.edu"
              />
            </label>
            <label className="field-label">
              Password
              <input
                name="password"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                required
                minLength={12}
                placeholder="At least 12 characters"
              />
            </label>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button className="button auth-submit" disabled={busy}>
              {busy ? "Please wait…" : signup ? "Create account" : "Log in"}{" "}
              <ArrowRight size={16} />
            </button>
          </form>
          <div className="auth-switch">
            {signup ? "Already have an account?" : "New to DreamOpps?"}{" "}
            <Link to={signup ? "/login" : "/signup"}>
              {signup ? "Log in" : "Create an account"}
            </Link>
          </div>
          <div className="privacy-promise">
            <ShieldCheck size={15} /> Your profile is private and in your
            control.
          </div>
        </div>
        <div className="auth-side">
          <div className="eyebrow">Make the next step a little clearer</div>
          <h2>
            Good things happen
            <br />
            when your potential
            <br />
            <span>meets opportunity.</span>
          </h2>
          <p>
            Save what catches your eye. Keep your applications on track. Get the
            context to move forward with confidence.
          </p>
          <div className="auth-side-orb">
            <Sparkles size={34} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
function UserPage({ kind }: { kind: string }) {
  const user = useServerSession();
  const { items } = useOpportunities();
  const [recommendationState, setRecommendationState] = useState<{
    userId: string;
    items: { item: Opportunity; match: MatchResult }[];
  } | null>(null);
  const userId = user?.id;
  const recommendations =
    recommendationState?.userId === userId ? recommendationState.items : [];
  const [profile, setProfile] = useState<StudentProfileDraft>({});
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState("");
  const [saved, setSaved] = useState(readSaved());
  const [apps, setApps] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dreamopps:apps") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetch(`${api}/recommendations`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.items)
          setRecommendationState({ userId, items: data.items });
      })
      .catch(() => {
        if (active) setRecommendationState({ userId, items: [] });
      });
    return () => {
      active = false;
    };
  }, [userId]);
  useEffect(() => {
    if (!userId) return;
    fetch(`${api}/saved`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.items) {
          const next = d.items.map(
            (x: { opportunityId: string }) => x.opportunityId,
          );
          setSaved(next);
          localStorage.setItem("dreamopps:saved", JSON.stringify(next));
        }
      })
      .catch(() => {});
    fetch(`${api}/applications`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.items) {
          const labels: Record<string, string> = {
            INTERESTED: "Interested",
            PREPARING: "Preparing",
            APPLIED: "Applied",
            INTERVIEWING: "Interviewing",
            OFFER: "Offer",
            NOT_PROCEEDING: "Not proceeding",
          };
          const next = d.items.map(
            (x: { id: string; opportunityId: string; status: string }) => ({
              id: x.opportunityId,
              applicationId: x.id,
              status: labels[x.status] || "Interested",
            }),
          );
          setApps(next);
          localStorage.setItem("dreamopps:apps", JSON.stringify(next));
        }
      })
      .catch(() => {});
    fetch(`${api}/profile`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.profile) {
          const p = {
            ...d.profile,
            level: d.profile.studyLevel || "",
            field: d.profile.fieldOfStudy || "",
            location: d.profile.country || "",
            nationality: d.profile.nationality || "",
            interests: (d.profile.interests || []).join(", "),
          };
          setProfile(p);
        }
      })
      .catch(() => {});
  }, [userId]);
  if (!user)
    return (
      <main className="container page-main">
        <div className="empty-state">
          <ShieldCheck />
          <h2>Sign in to continue</h2>
          <p>
            Your profile, saves and application tracker are private to your
            account.
          </p>
          <Link className="button" to="/login">
            Log in <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError("");
    setProfileSaved("");
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const payload = {
      studyLevel: String(d.level || "") || null,
      fieldOfStudy: String(d.field || "") || null,
      country: String(d.location || "") || null,
      nationality: String(d.nationality || "") || null,
      interests: String(d.interests || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };
    try {
      const response = await fetch(`${api}/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message || "Could not save profile.");
      setProfile({
        level: String(d.level || ""),
        field: String(d.field || ""),
        location: String(d.location || ""),
        nationality: String(d.nationality || ""),
        interests: String(d.interests || ""),
      });
      setProfileSaved("Profile saved.");
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "API unavailable. Profile was not saved.",
      );
    }
  }
  const title =
    kind === "dashboard"
      ? "Your space"
      : kind === "profile"
        ? "Profile & preferences"
        : kind === "saved"
          ? "Saved opportunities"
          : kind === "applications"
            ? "Application tracker"
            : kind === "recommendations"
              ? "Your recommendations"
              : kind === "notifications"
                ? "Notifications"
                : "Account settings";
  const matching = recommendations.map(({ item, match }) => ({
    item,
    score: match.score,
    factors: match.factors,
    eligibility: match.eligibility,
    explanation: match,
  }));
  async function addApp(item: Opportunity) {
    if (apps.some((a: { id: string }) => a.id === item.id)) return;
    let entry: { id: string; status: string; applicationId?: string } = {
      id: item.id,
      status: "Interested",
    };
    if (!item.id.startsWith("demo-")) {
      try {
        const r = await fetch(`${api}/applications`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            opportunityId: item.id,
            status: "INTERESTED",
          }),
        });
        const d = await r.json();
        if (!r.ok)
          throw new Error(d.error?.message || "Unable to add application.");
        entry = { ...entry, applicationId: d.item.id } as typeof entry;
      } catch (error) {
        alert(error instanceof Error ? error.message : "API unavailable.");
        return;
      }
    }
    const next = [...apps, entry];
    setApps(next);
    localStorage.setItem("dreamopps:apps", JSON.stringify(next));
  }
  async function toggleSaved(id: string) {
    const removing = saved.includes(id);
    if (!id.startsWith("demo-")) {
      try {
        const r = await fetch(`${api}/saved/${id}`, {
          method: removing ? "DELETE" : "PUT",
          credentials: "include",
        });
        if (!r.ok)
          throw new Error(
            "Unable to update saved opportunities. Sign in again and retry.",
          );
      } catch (error) {
        alert(error instanceof Error ? error.message : "API unavailable.");
        return;
      }
    }
    const n = removing ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(n);
    localStorage.setItem("dreamopps:saved", JSON.stringify(n));
  }
  async function updateApp(
    app: { id: string; applicationId?: string; status: string },
    status: string,
  ) {
    if (app.applicationId)
      try {
        const code =
          status === "Not proceeding" ? "NOT_PROCEEDING" : status.toUpperCase();
        const r = await fetch(`${api}/applications/${app.applicationId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: code }),
        });
        if (!r.ok) throw new Error("Unable to update application status.");
      } catch (error) {
        alert(error instanceof Error ? error.message : "API unavailable.");
        return;
      }
    const next = apps.map((x: { id: string }) =>
      x.id === app.id ? { ...x, status } : x,
    );
    setApps(next);
    localStorage.setItem("dreamopps:apps", JSON.stringify(next));
  }
  async function removeApp(app: { id: string; applicationId?: string }) {
    if (app.applicationId)
      try {
        const r = await fetch(`${api}/applications/${app.applicationId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!r.ok) throw new Error("Unable to remove application.");
      } catch (error) {
        alert(error instanceof Error ? error.message : "API unavailable.");
        return;
      }
    const next = apps.filter((x: { id: string }) => x.id !== app.id);
    setApps(next);
    localStorage.setItem("dreamopps:apps", JSON.stringify(next));
  }
  return (
    <>
      <main className="container app-shell">
        <aside className="app-nav">
          <div className="eyebrow">YOUR WORKSPACE</div>
          <NavLink to="/dashboard">
            <Layers3 />
            Overview
          </NavLink>
          <NavLink to="/recommendations">
            <Sparkles />
            For you
          </NavLink>
          <NavLink to="/saved">
            <Bookmark />
            Saved
          </NavLink>
          <NavLink to="/applications">
            <FileText />
            Applications
          </NavLink>
          <div className="app-nav-label">YOUR ACCOUNT</div>
          <NavLink to="/profile">
            <Settings />
            Profile & preferences
          </NavLink>
          <NavLink to="/notifications">
            <Bell />
            Notifications
          </NavLink>
          <NavLink to="/settings">
            <ShieldCheck />
            Account settings
          </NavLink>
          <div className="mini-profile">
            <span>
              {String(user.name || user.email)
                .slice(0, 1)
                .toUpperCase()}
            </span>
            <div>
              <b>{user.name || "Student"}</b>
              <small>Student account</small>
            </div>
          </div>
        </aside>
        <section className="app-content">
          <div className="page-intro compact">
            <div className="eyebrow">
              GOOD TO SEE YOU{user.name ? " AGAIN" : ""}
            </div>
            <h1>
              {title}
              <span>.</span>
            </h1>
            <p>
              {kind === "dashboard"
                ? "Your opportunities, all in one place."
                : kind === "profile"
                  ? "A few details help us show more relevant opportunities."
                  : "Stay close to the opportunities you care about."}
            </p>
          </div>
          {kind === "dashboard" && (
            <>
              <div className="dashboard-stats">
                <div>
                  <span>Saved</span>
                  <b>{saved.length}</b>
                  <Bookmark />
                </div>
                <div>
                  <span>In your tracker</span>
                  <b>{apps.length}</b>
                  <FileText />
                </div>
                <div>
                  <span>Profile status</span>
                  <b>{profile.level ? "In progress" : "Needs details"}</b>
                  <Target />
                </div>
              </div>
              <div className="subheading-row">
                <h2>Recommended for you</h2>
                <Link to="/recommendations">
                  See all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="opportunity-grid">
                {matching
                  .slice(0, 2)
                  .map(({ item, score, factors, eligibility }) => (
                    <div key={item.id}>
                      <div className="match-chip">
                        <Sparkles size={13} />
                        {score}% relevance · {eligibility} · {factors[0]}
                      </div>
                      <Card
                        item={item}
                        saved={saved.includes(item.id)}
                        toggle={toggleSaved}
                      />
                    </div>
                  ))}
              </div>
            </>
          )}
          {kind === "profile" && (
            <form className="profile-form" onSubmit={saveProfile}>
              <h2>About your studies</h2>
              <div className="form-grid">
                <label className="field-label">
                  Study level
                  <select name="level" defaultValue={profile.level || ""}>
                    <option value="">Choose your level</option>
                    {[
                      "Undergraduate",
                      "Postgraduate",
                      "Graduate",
                      "Doctoral",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Field of study
                  <input
                    name="field"
                    defaultValue={profile.field || ""}
                    placeholder="e.g. Environmental science"
                  />
                </label>
                <label className="field-label">
                  Country of residence
                  <input
                    name="location"
                    defaultValue={profile.location || ""}
                    placeholder="Where can you apply from?"
                  />
                </label>
                <label className="field-label">
                  Nationality
                  <input
                    name="nationality"
                    defaultValue={profile.nationality || ""}
                    placeholder="Used only to compare stated eligibility"
                  />
                </label>
                <label className="field-label">
                  Interests and skills
                  <input
                    name="interests"
                    defaultValue={profile.interests || ""}
                    placeholder="e.g. research, data, community"
                  />
                </label>
              </div>
              <div className="notice">
                <CircleHelp size={16} /> Matching is an explainable guide, not a
                probability of selection or a guarantee of eligibility.
              </div>
              {profileError && (
                <p className="form-error" role="alert">
                  {profileError}
                </p>
              )}
              {profileSaved && (
                <p className="success-note" role="status">
                  {profileSaved}
                </p>
              )}
              <button className="button">
                Save profile <Check size={16} />
              </button>
            </form>
          )}
          {kind === "recommendations" && (
            <>
              <div className="notice">
                <Sparkles size={16} /> Your match scores compare only
                information you have provided. Missing details do not count
                against you.
              </div>
              <div className="opportunity-grid">
                {matching.map(
                  ({ item, score, factors, eligibility, explanation }) => (
                    <div key={item.id}>
                      <div className="match-chip">
                        <Sparkles size={13} />
                        {score}% relevance · {eligibility}
                      </div>
                      <p className="match-explanation">
                        {explanation.nextAction}
                      </p>
                      {explanation.conflicts.length > 0 && (
                        <p className="form-error">
                          Potential conflicts:{" "}
                          {explanation.conflicts.join(" · ")}
                        </p>
                      )}
                      {explanation.missing.length > 0 && (
                        <p className="small-note">
                          Still to check: {explanation.missing.join(" · ")}
                        </p>
                      )}
                      {factors.length > 0 && (
                        <p className="small-note">
                          Why it may fit: {factors.join(" · ")}
                        </p>
                      )}
                      <Card
                        item={item}
                        saved={saved.includes(item.id)}
                        toggle={toggleSaved}
                      />
                    </div>
                  ),
                )}
              </div>
            </>
          )}
          {kind === "saved" && (
            <div className="opportunity-grid">
              {items
                .filter((i) => saved.includes(i.id))
                .map((i) => (
                  <Card key={i.id} item={i} saved toggle={toggleSaved} />
                ))}
              {!items.some((i) => saved.includes(i.id)) && (
                <div className="empty-state">
                  <Bookmark />
                  <h3>Your saved list is ready</h3>
                  <p>Save an opportunity to keep it close while you explore.</p>
                  <Link className="text-link" to="/opportunities">
                    Explore opportunities <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </div>
          )}
          {kind === "applications" && (
            <>
              <div className="tracker-list">
                {apps.map((a: { id: string; status: string }) => {
                  const item = items.find((i) => i.id === a.id);
                  return (
                    item && (
                      <div className="tracker-row" key={a.id}>
                        <div>
                          <span className="category-tag">{item.category}</span>
                          <Link to={"/opportunities/" + item.slug}>
                            <b>{item.title}</b>
                          </Link>
                          <small>
                            {item.provider} · Closes {item.deadline}
                          </small>
                        </div>
                        <select
                          value={a.status}
                          onChange={(e) => updateApp(a, e.target.value)}
                          aria-label={`Status for ${item.title}`}
                        >
                          {[
                            "Interested",
                            "Preparing",
                            "Applied",
                            "Interviewing",
                            "Offer",
                            "Not proceeding",
                          ].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                        <button
                          className="text-link"
                          onClick={() => removeApp(a)}
                        >
                          Remove
                        </button>
                      </div>
                    )
                  );
                })}
                {apps.length === 0 && (
                  <div className="empty-state">
                    <FileText />
                    <h3>No applications tracked yet</h3>
                    <p>Add an opportunity to track your next step.</p>
                    <Link className="button" to="/opportunities">
                      Find opportunities
                    </Link>
                  </div>
                )}
              </div>
              <div className="subheading-row">
                <h2>Recently discovered</h2>
              </div>
              <div className="opportunity-grid">
                {items.slice(0, 3).map((item) => (
                  <div key={item.id}>
                    <Card item={item} toggle={toggleSaved} />
                    <button
                      className="tracker-add"
                      onClick={() => addApp(item)}
                    >
                      + Add to tracker
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
function Admin() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [verificationNotes, setVerificationNotes] = useState<
    Record<string, string>
  >({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  function dateAtEndOfDayInZone(date: string, timezone: string) {
    const [year, month, day] = date.split("-").map(Number);
    const target = Date.UTC(year, month - 1, day, 23, 59);
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    let instant = target;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const parts = Object.fromEntries(
        formatter
          .formatToParts(new Date(instant))
          .map((part) => [part.type, part.value]),
      );
      const represented = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
      );
      instant += target - represented;
    }
    return new Date(instant).toISOString();
  }
  async function load() {
    try {
      const r = await fetch(api + "/admin/opportunities", {
        credentials: "include",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Admin access required.");
      setError("");
      setItems(d.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "API unavailable.");
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const slug = String(d.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    try {
      const r = await fetch(
        editingId
          ? api + "/admin/opportunities/" + editingId
          : api + "/admin/opportunities",
        {
          method: editingId ? "PUT" : "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: d.title,
            provider: d.provider,
            slug,
            description: d.description,
            category: d.category,
            eligibleCountries: String(d.countries || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            locations: String(d.locations || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            studyLevels: String(d.levels || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            fields: String(d.fields || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            requiredDocuments: String(d.documents || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            fundingAmount: d.fundingAmount
              ? Number(d.fundingAmount)
              : undefined,
            fundingCurrency: String(d.fundingCurrency || "") || undefined,
            fundingType: String(d.fundingType || "") || undefined,
            format: String(d.format || "") || undefined,
            applicationUrl: d.applicationUrl,
            deadline: d.deadline
              ? dateAtEndOfDayInZone(
                  String(d.deadline),
                  String(d.deadlineTimezone || "UTC"),
                )
              : null,
            deadlineTimezone: String(d.deadlineTimezone || "") || null,
          }),
        },
      );
      const out = await r.json();
      if (!r.ok)
        throw new Error(out.error?.message || "Could not create draft.");
      if (d.sourceUrl) {
        const sourceResponse = await fetch(
          api +
            "/admin/opportunities/" +
            (editingId || out.item.id) +
            "/source",
          {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              url: d.sourceUrl,
              authorized: false,
              name: "Admin submitted source",
            }),
          },
        );
        if (!sourceResponse.ok)
          throw new Error(
            "Listing saved, but source metadata could not be recorded.",
          );
      }
      setMessage(
        editingId
          ? "Opportunity changes saved."
          : "Draft created. It remains unpublished until reviewed.",
      );
      setEditingId(null);
      formRef.current?.reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "API unavailable.");
    } finally {
      setBusy(false);
    }
  }
  function edit(item: any) {
    const form = formRef.current;
    if (!form) return;
    const values: Record<string, string> = {
      title: item.title,
      provider: item.provider,
      category: item.category,
      description: item.description,
      countries: item.eligibleCountries?.join(", ") || "",
      levels: item.studyLevels?.join(", ") || "",
      fields: item.fields?.join(", ") || "",
      locations: item.locations?.join(", ") || "",
      documents: item.requiredDocuments?.join(", ") || "",
      fundingAmount: item.fundingAmount?.toString() || "",
      fundingCurrency: item.fundingCurrency || "",
      fundingType: item.fundingType || "",
      format: item.format || "",
      deadline: item.deadline
        ? new Date(item.deadline).toISOString().slice(0, 10)
        : "",
      deadlineTimezone: item.deadlineTimezone || "",
      applicationUrl: item.applicationUrl,
      sourceUrl: item.sources?.[0]?.url || "",
    };
    Object.entries(values).forEach(([name, value]) => {
      const control = form.elements.namedItem(name) as
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (control) control.value = value;
    });
    setEditingId(item.id);
    setMessage("Editing " + item.title + ". Save to update the listing.");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function status(
    item: any,
    status: string,
    verificationStatus?: string,
  ) {
    setError("");
    const details =
      verificationStatus === "VERIFIED"
        ? verificationNotes[item.id]?.trim()
        : "Admin workflow status update";
    if (verificationStatus === "VERIFIED" && !details) {
      setError(
        "Add a note describing the source details you checked before verifying.",
      );
      return;
    }
    try {
      const r = await fetch(
        api + "/admin/opportunities/" + item.id + "/status",
        {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            status,
            verificationStatus,
            details,
          }),
        },
      );
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.error?.message || "Could not update listing.");
      setMessage("Listing " + status.toLowerCase() + ".");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "API unavailable.");
    }
  }
  async function showHistory(item: any) {
    try {
      const r = await fetch(
        api + "/admin/opportunities/" + item.id + "/history",
        { credentials: "include" },
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Could not load history.");
      setHistory({ ...history, [item.id]: d.items });
    } catch (e) {
      setError(e instanceof Error ? e.message : "API unavailable.");
    }
  }
  return (
    <>
      <main className="container page-main">
        <div className="eyebrow">CONTENT OPERATIONS</div>
        <h1>
          Admin <span>workspace.</span>
        </h1>
        <div className="notice">
          <ShieldCheck size={17} /> Server checks the admin role for every
          action. Source credibility and current verification are tracked
          separately.
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success-note" role="status">
            {message}
          </p>
        )}
        <div className="admin-grid">
          <section className="profile-form">
            <h2>
              {editingId ? "Edit opportunity" : "Create an opportunity draft"}
            </h2>
            <form ref={formRef} onSubmit={create}>
              <label className="field-label">
                Title
                <input name="title" required minLength={3} />
              </label>
              <label className="field-label">
                Provider
                <input name="provider" required minLength={2} />
              </label>
              <label className="field-label">
                Category
                <select name="category">
                  {[
                    "Scholarship",
                    "Internship",
                    "Graduate job",
                    "Fellowship",
                    "Competition",
                    "Grant",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Description
                <textarea name="description" required minLength={20} />
              </label>
              <label className="field-label">
                Eligible countries
                <input
                  name="countries"
                  placeholder="Global or comma-separated countries"
                />
              </label>
              <label className="field-label">
                Study levels
                <input
                  name="levels"
                  placeholder="Undergraduate, Postgraduate"
                />
              </label>
              <label className="field-label">
                Fields of study
                <input name="fields" />
              </label>
              <label className="field-label">
                Locations
                <input name="locations" placeholder="Remote, Nairobi" />
              </label>
              <label className="field-label">
                Required documents
                <input
                  name="documents"
                  placeholder="Transcript, CV, proposal"
                />
              </label>
              <label className="field-label">
                Funding amount
                <input name="fundingAmount" type="number" min="0" step="0.01" />
              </label>
              <label className="field-label">
                Funding currency
                <input name="fundingCurrency" maxLength={3} placeholder="USD" />
              </label>
              <label className="field-label">
                Funding type or summary
                <input
                  name="fundingType"
                  placeholder="Fully funded, paid, stipend"
                />
              </label>
              <label className="field-label">
                Format
                <select name="format">
                  <option value="">Not specified</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="IN_PERSON">In person</option>
                </select>
              </label>
              <label className="field-label">
                Deadline
                <input name="deadline" type="date" />
                <small>
                  When only a date is known, it is treated as closing at 11:59
                  PM in the timezone below.
                </small>
              </label>
              <label className="field-label">
                Deadline timezone, if stated by the source
                <input
                  name="deadlineTimezone"
                  defaultValue={
                    Intl.DateTimeFormat().resolvedOptions().timeZone
                  }
                  placeholder="e.g. Africa/Nairobi or UTC"
                />
              </label>
              <label className="field-label">
                Application URL
                <input name="applicationUrl" type="url" required />
              </label>
              <label className="field-label">
                Original source URL
                <input name="sourceUrl" type="url" required />
              </label>
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : editingId ? "Save changes" : "Create draft"}{" "}
                <Check size={15} />
              </button>
              {editingId && (
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setEditingId(null);
                    formRef.current?.reset();
                    setMessage("");
                  }}
                >
                  Cancel edit
                </button>
              )}
            </form>
          </section>
          <section className="profile-form">
            <h2>Review queue</h2>
            {items.length === 0 ? (
              <p>No drafts or published opportunities need review.</p>
            ) : (
              items.map((x: any) => (
                <div className="admin-record" key={x.id}>
                  <b>{x.title}</b>
                  <small>
                    {x.status} · {x.verificationStatus} · {x.sourceCredibility}
                  </small>
                  <small>
                    {x.sources?.map((src: any) => src.url).join(" · ") ||
                      "No source recorded"}
                  </small>
                  <label className="field-label">
                    Verification note
                    <textarea
                      value={verificationNotes[x.id] || ""}
                      onChange={(event) =>
                        setVerificationNotes({
                          ...verificationNotes,
                          [x.id]: event.target.value,
                        })
                      }
                      placeholder="Describe the official page and details you checked"
                      maxLength={2000}
                    />
                  </label>
                  <div>
                    <button onClick={() => edit(x)}>Edit</button>
                    <button onClick={() => status(x, x.status, "IN_REVIEW")}>
                      Mark in review
                    </button>
                    <button onClick={() => status(x, x.status, "VERIFIED")}>
                      Record verified
                    </button>
                    <button onClick={() => status(x, "PUBLISHED")}>
                      Publish
                    </button>
                    <button onClick={() => status(x, "ARCHIVED")}>
                      Archive
                    </button>
                    <button onClick={() => status(x, "EXPIRED")}>Expire</button>
                    <button
                      onClick={() => status(x, x.status, "NEEDS_ATTENTION")}
                    >
                      Flag
                    </button>
                    <button onClick={() => showHistory(x)}>History</button>
                  </div>
                  {history[x.id]?.map((evt: any) => (
                    <small className="history-line" key={evt.id}>
                      {new Date(evt.checkedAt).toLocaleString()} · {evt.action}
                    </small>
                  ))}
                </div>
              ))
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
function Info({ type }: { type: string }) {
  const about = type === "about";
  return (
    <>
      <main className="container page-main legal">
        <div className="eyebrow">
          {about ? "OUR APPROACH" : "YOUR PRIVACY MATTERS"}
        </div>
        <h1>
          {about ? "More signal." : "A thoughtful start."}
          <br />
          <span>{about ? "Less noise." : "Built with care."}</span>
        </h1>
        {about ? (
          <>
            <p className="lead">
              DreamOpps Intelligence helps students understand opportunities,
              how they fit, and what to do next.
            </p>
            <h2>What we believe</h2>
            <p>
              Opportunity information should be clear and actionable. A listing
              should show what it offers, who may apply, when it closes, and
              where its information came from.
            </p>
            <h2>How matching works</h2>
            <p>
              Our initial matching approach is deterministic and explainable. It
              compares profile details with stated opportunity criteria, shows
              the factors and missing information, and flags known conflicts. A
              score is a relevance guide, never a chance of being selected or a
              promise of eligibility.
            </p>
            <h2>Source integrity</h2>
            <p>
              Source credibility and verification are tracked separately.
              Imported information is not automatically verified. Demonstration
              records are fictional and visibly labelled; they do not represent
              live openings.
            </p>
            <h2>Our roadmap</h2>
            <p>
              We’re building toward trusted source integrations, reminders, and
              richer opportunity context. External feeds will be added only with
              appropriate authorization and clear provenance.
            </p>
          </>
        ) : (
          <>
            <p className="lead">
              DreamOpps is an MVP. This page explains our intended data
              practices; it is not jurisdiction-specific legal advice.
            </p>
            <h2>Information we use</h2>
            <p>
              Account information and optional study preferences help provide
              profile, saved opportunity, and matching features. Avoid adding
              sensitive information. We do not ask for passport scans or
              financial credentials.
            </p>
            <h2>How information is handled</h2>
            <p>
              Account data is intended to be stored securely and used to deliver
              the service. This prototype may store preferences and
              demonstration saves in your browser. Do not use real sensitive
              data until the service is deployed with production security
              controls.
            </p>
            <h2>Your choices and retention</h2>
            <p>
              You can remove locally stored demo data by clearing this site's
              storage. A production deployment should provide account export and
              deletion, a retention schedule, and a privacy contact before
              collecting real student data.
            </p>
            <h2>Security and contact</h2>
            <p>
              Security controls are documented in the repository. Worldwide
              legal compliance requires review for each jurisdiction and is not
              claimed by this MVP.
            </p>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
function Terms() {
  return (
    <>
      <main className="container page-main legal">
        <div className="eyebrow">TERMS OF USE · MVP DRAFT</div>
        <h1>
          Use the platform
          <br />
          <span>with care.</span>
        </h1>
        <p className="lead">
          These plain-language terms describe this early product prototype. They
          require legal review before a public production launch.
        </p>
        <h2>What DreamOpps provides</h2>
        <p>
          DreamOpps organizes opportunity information and offers profile-based
          relevance guidance. Matching is informational, may be incomplete, and
          is not a guarantee of eligibility, acceptance, funding, employment, or
          selection.
        </p>
        <h2>Check the original source</h2>
        <p>
          Opportunity requirements and deadlines can change. Confirm current
          details directly with the provider before sharing information or
          applying. Demonstration opportunities are fictional and are not
          genuine openings.
        </p>
        <h2>Your account and content</h2>
        <p>
          Keep your login credentials private and provide accurate account
          information. Do not upload unnecessary sensitive personal information.
          You remain responsible for application submissions and any information
          you share with opportunity providers.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Do not abuse the service, attempt unauthorized access, disrupt other
          users, or submit misleading listings. Administrators may remove
          inaccurate or expired listings.
        </p>
        <h2>Availability and changes</h2>
        <p>
          This MVP is provided as an evolving service. It may contain errors or
          unavailable features. These terms need jurisdiction-specific legal
          review before the platform is used with real student accounts.
        </p>
      </main>
      <Footer />
    </>
  );
}
function AccountPanel({ notifications = false }: { notifications?: boolean }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [prefs, setPrefs] = useState({
    deadlineReminders: true,
    recommendationUpdates: true,
    emailEnabled: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [busy, setBusy] = useState(false);
  const user = useServerSession();
  const authed = Boolean(user);
  useEffect(() => {
    if (notifications && authed)
      fetch(`${api}/notifications/preferences`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (d.preferences) setPrefs(d.preferences);
        })
        .catch(() => setError("Could not load preferences from the API."));
  }, [notifications, authed]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${api}/notifications/preferences`, {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || "Unable to save preferences.");
      setMessage("Notification preferences saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "API unavailable.");
    } finally {
      setBusy(false);
    }
  }
  async function removeAccount() {
    if (
      !confirm(
        "Delete your DreamOpps account and associated profile, saves, applications, and sessions? This cannot be undone.",
      )
    )
      return;
    setBusy(true);
    try {
      const response = await fetch(`${api}/account`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok)
        throw new Error(
          "Could not delete the account. Sign in again and retry.",
        );
      [
        "dreamopps:user",
        "dreamopps:profile",
        "dreamopps:saved",
        "dreamopps:apps",
      ].forEach((key) => localStorage.removeItem(key));
      announceSessionChange();
      setMessage("Account deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "API unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <main className="container app-shell">
        <aside className="app-nav">
          <div className="eyebrow">YOUR WORKSPACE</div>
          <NavLink to="/dashboard">
            <Layers3 />
            Overview
          </NavLink>
          <NavLink to="/profile">
            <Settings />
            Profile
          </NavLink>
          <NavLink to="/notifications">
            <Bell />
            Notifications
          </NavLink>
          <NavLink to="/settings">
            <ShieldCheck />
            Account settings
          </NavLink>
        </aside>
        <section className="app-content">
          <div className="page-intro compact">
            <div className="eyebrow">YOUR ACCOUNT</div>
            <h1>
              {notifications ? "Notification preferences" : "Account settings"}
              <span>.</span>
            </h1>
            <p>
              {notifications
                ? "Choose which reminders you want to receive."
                : "Manage access to your DreamOpps account and personal data."}
            </p>
          </div>
          {!authed ? (
            <div className="notice">
              <ShieldCheck /> Sign in to manage your account.{" "}
              <Link to="/login">Log in</Link>
            </div>
          ) : notifications ? (
            <form className="profile-form" onSubmit={save}>
              <label className="preference-row">
                <span>
                  <b>Deadline reminders</b>
                  <small>Get reminders before saved opportunities close.</small>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.deadlineReminders}
                  onChange={(e) =>
                    setPrefs({ ...prefs, deadlineReminders: e.target.checked })
                  }
                />
              </label>
              <label className="preference-row">
                <span>
                  <b>Recommendation updates</b>
                  <small>Hear when relevant opportunities are added.</small>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.recommendationUpdates}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      recommendationUpdates: e.target.checked,
                    })
                  }
                />
              </label>
              <label className="preference-row">
                <span>
                  <b>Email delivery</b>
                  <small>
                    Email delivery requires a configured mail provider.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.emailEnabled}
                  onChange={(e) =>
                    setPrefs({ ...prefs, emailEnabled: e.target.checked })
                  }
                />
              </label>
              <label className="field-label">
                Timezone
                <input
                  value={prefs.timezone || ""}
                  onChange={(e) =>
                    setPrefs({ ...prefs, timezone: e.target.value })
                  }
                  placeholder="Africa/Nairobi"
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="success-note" role="status">
                  {message}
                </p>
              )}
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : "Save preferences"} <Check size={15} />
              </button>
            </form>
          ) : (
            <div className="profile-form danger-zone">
              <h2>Delete your account</h2>
              <p>
                Deletion removes your profile, saved opportunities,
                applications, preferences, and server sessions.
              </p>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="success-note" role="status">
                  {message}
                </p>
              )}
              <button
                className="button danger-button"
                disabled={busy}
                onClick={removeAccount}
              >
                {busy ? "Working…" : "Delete account"}
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/opportunities" element={<Discovery />} />
        <Route path="/opportunities/:slug" element={<Detail />} />
        <Route path="/signup" element={<Auth signup />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<UserPage kind="dashboard" />} />
        <Route path="/profile" element={<UserPage kind="profile" />} />
        <Route path="/saved" element={<UserPage kind="saved" />} />
        <Route
          path="/applications"
          element={<UserPage kind="applications" />}
        />
        <Route
          path="/recommendations"
          element={<UserPage kind="recommendations" />}
        />
        <Route path="/notifications" element={<AccountPanel notifications />} />
        <Route path="/settings" element={<AccountPanel />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/about" element={<Info type="about" />} />
        <Route path="/privacy" element={<Info type="privacy" />} />
        <Route path="/terms" element={<Terms />} />
        <Route
          path="*"
          element={
            <main className="container page-main">
              <div className="empty-state">
                <h1>Page not found</h1>
                <Link className="button" to="/">
                  Return home
                </Link>
              </div>
            </main>
          }
        />
      </Routes>
    </>
  );
}
