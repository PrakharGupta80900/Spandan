import { FiMail, FiAward, FiUser, FiCode, FiGithub, FiLinkedin } from "react-icons/fi";

import devImage from "../../img/dev.jpg";

const PROFILE = {
  name: "Prakhar Gupta",
  role: "Admin • Vice-President",
  email: "prakhargupta448@gmail.com",
  github: "https://github.com/PrakharGupta80900",
  linkedin: "https://linkedin.com/in/prakhar-gupta80900",
  photo: devImage,
  highlights: [
    "Overseeing Spandan 2026 registrations and event coordination",
    "Aspiring Software Developer experiencing in Full Stack Web Developer",
    "Primary point of contact for participant support",
  ],
  tech: [
    "MERN stack",
    "Cloud & DevOps basics",
    "Designing secure registration flows",
  ],
};

export default function Developer() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-900/40 text-primary-300 text-xs font-semibold">
          <FiCode size={14} /> Developer Profile
        </p>
        <h1 className="text-3xl font-bold text-white mt-3">Meet the Admin</h1>
        <p className="text-gray-400 mt-2">Your point of contact for Spandan 2026 registrations and support.</p>
      </div>

      <div className="card p-6 flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-1/3 bg-gray-900/60 border border-gray-800 rounded-xl p-5 text-center">
          {PROFILE.photo ? (
            <img
              src={PROFILE.photo}
              alt={PROFILE.name}
              className="w-32 h-32 mx-auto rounded-full object-cover object-[50%_25%] border-2 border-primary-700"
            />
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-primary-700 flex items-center justify-center text-white text-2xl font-bold">
              {PROFILE.name[0]}
            </div>
          )}
          <h2 className="text-white font-semibold text-lg mt-3">{PROFILE.name}</h2>
          <p className="text-primary-300 text-sm">{PROFILE.role}</p>
          <div className="mt-4 space-y-2 text-gray-300 text-sm">
            <div className="flex items-center justify-center gap-2 text-gray-400"><FiUser size={14} /> Admin</div>
            <div className="flex items-center justify-center gap-2 text-gray-400"><FiMail size={14} /> {PROFILE.email}</div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            {PROFILE.linkedin && (
              <a
                href={PROFILE.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 transition"
                title="LinkedIn"
              >
                <FiLinkedin size={18} />
              </a>
            )}
            {PROFILE.github && (
              <a
                href={PROFILE.github}
                target="_blank"
                rel="noreferrer"
                className="text-gray-300 hover:text-white transition"
                title="GitHub"
              >
                <FiGithub size={18} />
              </a>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-5">
          <section>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><FiAward size={15} /> Highlights</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
              {PROFILE.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><FiCode size={15} /> Tech Focus</h3>
            <div className="flex flex-wrap gap-2">
              {PROFILE.tech.map((tag) => (
                <span key={tag} className="badge bg-gray-900 text-gray-200">{tag}</span>
              ))}
            </div>
          </section>

          <section className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-300 text-sm">
              For any account issues, event corrections, or urgent support, reach out to {PROFILE.name} at {PROFILE.email}. The admin can verify participant details, handle team updates, and assist with registration clarifications.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
