import { Link } from 'react-router-dom';
import { ArrowLeftRight, Wrench, BookOpen, Utensils, Car, Palette, Heart } from 'lucide-react';

const examples = [
  { icon: Wrench, label: 'Fix my bike', swap: 'Teach me Excel' },
  { icon: BookOpen, label: 'Tutor in Math', swap: 'Help with my website' },
  { icon: Utensils, label: 'Cook dinner', swap: 'Walk my dog' },
  { icon: Car, label: 'Airport ride', swap: 'Design a logo' },
  { icon: Palette, label: 'Paint a wall', swap: 'Fix my laptop' },
  { icon: Heart, label: 'Yoga session', swap: 'Help move furniture' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <ArrowLeftRight size={14} />
          No money needed — just skills
        </div>
        <h1 className="text-5xl font-extrabold text-dark mb-6 leading-tight">
          Trade your skills,<br />
          <span className="text-primary-500">not your wallet</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-10">
          SwapCircle connects people who can help each other. Offer what you're good at,
          get what you need — no cash, just community.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register" className="btn-primary text-base px-6 py-3">Start swapping</Link>
          <Link to="/login" className="btn-outline text-base px-6 py-3">Log in</Link>
        </div>
      </section>

      <section className="bg-primary-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-dark mb-3">How it works</h2>
          <p className="text-center text-gray-500 mb-10">Three steps to a fair exchange</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Post what you offer', desc: 'List a skill or service you can provide — fixing bikes, tutoring, cooking, anything.' },
              { step: '02', title: 'Find what you need', desc: 'Browse requests and offers from your community. Found something? Propose a swap.' },
              { step: '03', title: 'Exchange & rate', desc: 'Do the swap, mark it complete, and rate each other. Build your reputation.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-4xl font-black text-primary-200 mb-3">{step}</div>
                <h3 className="font-bold text-dark mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center text-dark mb-10">Real swap ideas</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {examples.map(({ icon: Icon, label, swap }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                <Icon size={18} className="text-primary-600" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-dark">{label}</p>
                <p className="text-gray-400">↔ {swap}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-dark py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to start?</h2>
        <p className="text-gray-400 mb-8">Join the community — free, always.</p>
        <Link to="/register" className="btn-primary text-base px-8 py-3 inline-block">Create your account</Link>
      </section>
    </div>
  );
}
