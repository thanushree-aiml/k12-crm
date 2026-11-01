import { useState } from 'react';
import { api } from '../api.js';

const USER_TYPES = [
  { v: 'Parent', icon: '👨‍👩‍👧' },
  { v: 'Student', icon: '🎓' },
  { v: 'School', icon: '🏫' },
];
const CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];
const empty = { user_type: '', category: '', name: '', email: '', phone: '', message: '' };

// Defined OUTSIDE the form component so inputs keep focus while typing
function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="err">{error}</small>}
    </label>
  );
}

export default function InquiryForm() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    const e = {};
    if (!form.user_type) e.user_type = 'Please choose who you are';
    if (!form.category) e.category = 'Select a category';
    if (form.name.trim().length < 2) e.name = 'Enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!/^[+]?[0-9\s-]{7,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number';
    if (form.message.trim().length < 5) e.message = 'Message is too short';
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setStatus({ type: '', text: '' });
    try {
      await api('/inquiries', { method: 'POST', body: form });
      setStatus({ type: 'success', text: '🎉 Thank you! Your inquiry has been submitted. We will contact you soon.' });
      setForm(empty);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrors(err.errors || {});
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="hero">
        <h1>How can we help you?</h1>
        <p>Scholarships, admissions, concerts or any other question – send us your inquiry and our team will respond.</p>
      </section>

      <form className="card overlap" onSubmit={submit} noValidate>
        {status.text && <div className={`alert ${status.type}`}>{status.text}</div>}

        <div className="field">
          <span>I am a</span>
          <div className="chips">
            {USER_TYPES.map((t) => (
              <button type="button" key={t.v}
                className={`chip ${form.user_type === t.v ? 'active' : ''}`}
                onClick={() => setForm({ ...form, user_type: t.v })}>
                <span>{t.icon}</span> {t.v}
              </button>
            ))}
          </div>
          {errors.user_type && <small className="err">{errors.user_type}</small>}
        </div>

        <Field label="Category" error={errors.category}>
          <select value={form.category} onChange={set('category')}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Full name" error={errors.name}>
          <input value={form.name} onChange={set('name')} placeholder="Your name" />
        </Field>

        <div className="grid2">
          <Field label="Email" error={errors.email}>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          </Field>
          <Field label="Phone number" error={errors.phone}>
            <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
          </Field>
        </div>

        <Field label="Message / Query" error={errors.message}>
          <textarea rows="5" value={form.message} onChange={set('message')} placeholder="Write your query here..." />
        </Field>

        <button className="btn full" disabled={loading}>{loading ? 'Submitting...' : 'Submit Inquiry →'}</button>
      </form>
    </>
  );
}