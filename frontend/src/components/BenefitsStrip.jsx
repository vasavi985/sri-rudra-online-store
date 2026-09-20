import { ShieldCheck, HeartHandshake, MapPin, Sparkles, PhoneCall } from 'lucide-react';
import './BenefitsStrip.css';

const BENEFITS = [
  {
    id: 1,
    title: 'Pure & Clean',
    subtitle: 'Carefully selected',
    icon: Sparkles,
  },
  {
    id: 2,
    title: 'Trusted Quality',
    subtitle: 'For your family',
    icon: ShieldCheck,
  },
  {
    id: 3,
    title: 'Local Business',
    subtitle: 'Rajahmundry',
    icon: MapPin,
  },
  {
    id: 4,
    title: 'Everyday Essentials',
    subtitle: 'For your kitchen',
    icon: HeartHandshake,
  },
  {
    id: 5,
    title: 'Customer Support',
    subtitle: '9949406863',
    icon: PhoneCall,
    href: 'tel:9949406863',
  },
];

const BenefitsStrip = () => {
  return (
    <section className="benefits-strip-section" aria-label="Why Choose Sri Rudra">
      <div className="container">
        <div className="benefits-grid">
          {BENEFITS.map((item) => {
            const Icon = item.icon;
            const CardContent = (
              <>
                <div className="benefit-icon-wrapper">
                  <Icon size={22} className="benefit-icon" />
                </div>
                <div className="benefit-text">
                  <h4 className="benefit-title">{item.title}</h4>
                  <p className="benefit-subtitle">{item.subtitle}</p>
                </div>
              </>
            );

            return item.href ? (
              <a
                key={item.id}
                href={item.href}
                className="benefit-card benefit-card-link"
                title={`Call ${item.subtitle}`}
              >
                {CardContent}
              </a>
            ) : (
              <div key={item.id} className="benefit-card">
                {CardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsStrip;
