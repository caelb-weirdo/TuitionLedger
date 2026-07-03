import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-logo"><i className="fas fa-book-open"></i> TuitionLedger</div>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </nav>

      <section className="landing-hero">
        <h1>Manage Your Tuition Classes Smarter</h1>
        <p>
          QR attendance, fee tracking, and parent reminders — all in one mobile-friendly dashboard
          built for Sri Lankan private tuition tutors.
        </p>
        <Link to="/login" className="btn btn-primary btn-lg">
          <i className="fas fa-sign-in-alt"></i> Get Started
        </Link>
      </section>

      <section className="landing-features">
        <h2>Everything You Need</h2>
        <div className="features-grid">
          <div className="feature-card">
            <i className="fas fa-qrcode"></i>
            <h3>QR Attendance</h3>
            <p>Generate secure QR codes for each class session. Students scan to mark attendance instantly.</p>
          </div>
          <div className="feature-card">
            <i className="fas fa-mobile-alt"></i>
            <h3>Device Verification</h3>
            <p>Approve registered student devices to reduce proxy attendance and cheating.</p>
          </div>
          <div className="feature-card">
            <i className="fas fa-money-bill-wave"></i>
            <h3>Fee Tracking</h3>
            <p>Track monthly payments — paid, unpaid, partial, and overdue — at a glance.</p>
          </div>
          <div className="feature-card">
            <i className="fab fa-whatsapp"></i>
            <h3>WhatsApp Reminders</h3>
            <p>Send fee reminders via WhatsApp click-to-chat. You control when messages are sent.</p>
          </div>
          <div className="feature-card">
            <i className="fas fa-chart-bar"></i>
            <h3>Reports</h3>
            <p>Monthly attendance and fee reports with printable tables for your records.</p>
          </div>
          <div className="feature-card">
            <i className="fas fa-shield-alt"></i>
            <h3>Secure & Simple</h3>
            <p>Role-based access, device checks, and backend validation keep your data safe.</p>
          </div>
        </div>
      </section>

      <section className="landing-how">
        <h2 style={{ textAlign: 'center' }}>How It Works</h2>
        <div className="how-steps">
          <div className="how-step">
            <div className="step-number">1</div>
            <h3>Tutor Generates QR</h3>
            <p className="text-secondary">Select class, set time limit, display QR on screen.</p>
          </div>
          <div className="how-step">
            <div className="step-number">2</div>
            <h3>Student Scans</h3>
            <p className="text-secondary">Student scans with phone camera from approved device.</p>
          </div>
          <div className="how-step">
            <div className="step-number">3</div>
            <h3>Attendance Marked</h3>
            <p className="text-secondary">System validates and confirms attendance instantly.</p>
          </div>
          <div className="how-step">
            <div className="step-number">4</div>
            <h3>Track & Remind</h3>
            <p className="text-secondary">Monitor fees and send parent reminders via WhatsApp.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
