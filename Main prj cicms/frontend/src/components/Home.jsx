import { Link } from "react-router-dom";
import Header from "./common/Header";
import "../styles/Home.css";
// import cardImage from "../assets/cardImage.jpg"; 
import featureImage1 from "../assets/featureImage1.jpeg"; 
import featureImage2 from "../assets/featureImage2.jpeg"; 
import featureImage3 from "../assets/images.png"; 
import cardImage from "../assets/cardImage.jpg";

const Home = () => {
  const features = [
    {
      title: "Advanced Hardware Setup",
      image: featureImage1,
      alt: "Hardware Setup",
      points: [
        "Raspberry Pi 4 Model B with 2GB RAM for powerful edge computing",
        "High-resolution Camera Module V3 with 5MP",
        "Infrared lighting for low-light performance",
        "Voice commands through speaker",
      ],
    },
    {
      title: "AI-Powered Features",
      image: featureImage2,
      alt: "AI Features",
      points: [
        "Real-time facial detection and recognition using TensorFlow",
        "Advanced anti-spoofing with liveness detection",
        "Military-grade encryption for data security",
        "Automated attendance logging and reporting",
      ],
    },
    {
      title: "Cloud Integration",
      image: featureImage3,
      alt: "Cloud Integration",
      points: [
        "Seamless synchronization with cloud databases",
        "Real-time data backup and recovery",
        "Cross-platform accessibility from any device",
        "Automatic software updates and maintenance",
      ],
    },
  ];

  return (
    <div className="home-container">
      <Header />

      <main className="home-content">
        <section className="app-info-card">
          <div className="card-content">
            <div className="card-text">
              <h2>Next-Generation Attendance System</h2>
              <p>
                Our state-of-the-art facial recognition attendance system
                combines powerful hardware with sophisticated AI algorithms to
                deliver unparalleled accuracy and security in attendance
                tracking.
              </p>
              <Link to="/dashboard" className="cta-button">
                Go to Dashboard
              </Link>
            </div>
            <div className="card-image">
              <img
                src={cardImage}
                alt="Facial Recognition System"
                className="system-image"
              />
            </div>
          </div>
        </section>

        <section className="features-section">
          <h2 className="features-title">Key Features</h2>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-item">
                <h3>{feature.title}</h3>
                <img
                  src={feature.image}
                  alt={feature.alt}
                  className="feature-image"
                />
                <ul className="feature-list">
                  {feature.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
