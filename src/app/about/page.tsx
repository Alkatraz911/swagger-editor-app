import { getTranslations } from "next-intl/server";
import Link from "next/link";

type TeamMember = {
  name: string;
  role: string;
  github: string;
};

export default async function AboutPage() {
  const t = await getTranslations("about");
  const members = t.raw("team.members") as TeamMember[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("course.title")}</h2>
        <p className="max-w-3xl text-sm leading-relaxed opacity-80">
          {t("course.description")}
        </p>
        <Link
          href={t("links.rsSchool")}
          className="w-fit text-sm font-medium hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("course.linkLabel")}
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("team.title")}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <li
              key={member.github}
              className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10"
            >
              <span className="font-mono text-sm font-semibold">
                {member.name}
              </span>
              <span className="text-sm opacity-70">{member.role}</span>
              <Link
                href={member.github}
                className="text-sm hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("team.githubLink", { name: member.name })}
              >
                GitHub
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("project.title")}</h2>
        <p className="max-w-3xl text-sm leading-relaxed opacity-80">
          {t("project.description")}
        </p>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">
            {t("project.technologiesTitle")}
          </h3>
          <p className="text-sm opacity-70">{t("project.technologies")}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t("project.linksTitle")}</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href={t("links.repository")}
              className="hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("project.repoLabel")}
            </Link>
            <Link
              href={t("links.demo")}
              className="hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("project.demoLabel")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
