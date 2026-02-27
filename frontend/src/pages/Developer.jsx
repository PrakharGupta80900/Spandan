import { FiMail, FiAward, FiUser, FiCode, FiGithub, FiLinkedin } from "react-icons/fi";

import devImage from "../../img/dev.jpg";

const PROFILE = {
  name: "Prakhar Gupta",
  role: "Admin - Vice-President",
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
        <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3DBBB] border border-[#41431B]/30 text-[#41431B] text-xs font-semibold">
          <FiCode size={14} /> Developer Profile
        </p>
        <h1 className="text-3xl font-bold text-[#41431B] mt-3">Meet the Admin</h1>
        <p className="text-[#41431B]/80 mt-2">Your point of contact for Spandan 2026 registrations and support.</p>
      </div>

      <div className="card p-6 flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-1/3 bg-[#E3DBBB] border border-[#41431B]/30 rounded-xl p-5 text-center">
          {PROFILE.photo ? (
            <img
              src={PROFILE.photo}
              alt={PROFILE.name}
              width={128}
              height={128}
              loading="eager"
              decoding="async"
              className="w-32 h-32 mx-auto rounded-full object-cover object-[50%_25%] border-2 border-[#41431B]"
            />
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-[#AEB784] flex items-center justify-center !text-black text-2xl font-bold">
              {PROFILE.name[0]}
            </div>
          )}
          <h2 className="text-[#41431B] font-semibold text-lg mt-3">{PROFILE.name}</h2>
          <p className="text-[#41431B] text-sm">{PROFILE.role}</p>
          <div className="mt-4 space-y-2 text-[#41431B] text-sm">
            <div className="flex items-center justify-center gap-2 text-[#41431B]"><FiUser size={14} /> Admin</div>
            <div className="flex items-center justify-center gap-2 text-[#41431B]"><FiMail size={14} /> {PROFILE.email}</div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            {PROFILE.linkedin && (
              <a
                href={PROFILE.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-[#41431B] hover:text-black transition"
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
                className="text-[#41431B] hover:text-black transition"
                title="GitHub"
              >
                <FiGithub size={18} />
              </a>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-5">
          <section>
            <h3 className="text-[#41431B] font-semibold mb-2 flex items-center gap-2"><FiAward size={15} /> Highlights</h3>
            <ul className="list-disc list-inside space-y-1 text-[#41431B] text-sm">
              {PROFILE.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-[#41431B] font-semibold mb-2 flex items-center gap-2"><FiCode size={15} /> Tech Focus</h3>
            <div className="flex flex-wrap gap-2">
              {PROFILE.tech.map((tag) => (
                <span key={tag} className="badge bg-[#AEB784] border border-[#41431B]/30 !text-black">{tag}</span>
              ))}
            </div>
          </section>

          <section className="bg-[#E3DBBB] border border-[#41431B]/30 rounded-lg p-4">
            <p className="text-[#41431B] text-sm">
              For any account issues, event corrections, or urgent support, reach out to {PROFILE.name} at {PROFILE.email}. The admin can verify participant details, handle team updates, and assist with registration clarifications.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

