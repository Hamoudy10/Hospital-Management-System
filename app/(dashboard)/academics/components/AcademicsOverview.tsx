import Link from "next/link";
import {
  Calendar,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Settings,
  ArrowRight,
  Users,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface AcademicsOverviewProps {
  academicYears: any[];
  terms: any[];
  classes: any[];
}

type StatusVariant = "success" | "info" | "warning" | "default";

function parseDate(value?: string | null) {
  if (!value) {return null;}
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value?: string | null) {
  const date = parseDate(value);
  if (!date) {return "Not set";}
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(
  start?: string | null,
  end?: string | null,
  isActive?: boolean,
): { label: string; variant: StatusVariant } {
  if (isActive) {
    return { label: "Active", variant: "success" };
  }

  const now = new Date();
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (startDate && startDate > now) {
    return { label: "Upcoming", variant: "info" };
  }

  if (endDate && endDate < now) {
    return { label: "Completed", variant: "default" };
  }

  return { label: "Inactive", variant: "warning" };
}

export function AcademicsOverview({
  academicYears,
  terms,
  classes,
}: AcademicsOverviewProps) {
  const sortedYears = [...academicYears].sort((a, b) => {
    const aDate = parseDate(a.start_date)?.getTime() ?? 0;
    const bDate = parseDate(b.start_date)?.getTime() ?? 0;
    return bDate - aDate;
  });

  const sortedTerms = [...terms].sort((a, b) => {
    const aDate = parseDate(a.start_date)?.getTime() ?? 0;
    const bDate = parseDate(b.start_date)?.getTime() ?? 0;
    return bDate - aDate;
  });

  const activeYear =
    sortedYears.find((year) => year.is_active) ||
    sortedYears.find((year) => {
      const start = parseDate(year.start_date);
      const end = parseDate(year.end_date);
      return start && end && start <= new Date() && end >= new Date();
    }) ||
    sortedYears[0];

  const activeTerm =
    sortedTerms.find((term) => term.is_active) ||
    sortedTerms.find((term) => {
      const start = parseDate(term.start_date);
      const end = parseDate(term.end_date);
      return start && end && start <= new Date() && end >= new Date();
    }) ||
    sortedTerms[0];

  const yearStatus = activeYear
    ? getStatusLabel(activeYear.start_date, activeYear.end_date, activeYear.is_active)
    : null;

  const termStatus = activeTerm
    ? getStatusLabel(activeTerm.start_date, activeTerm.end_date, activeTerm.is_active)
    : null;

  const setupSteps = [
    {
      title: "Academic year",
      description:
        "Create a year and mark it active to unlock terms, assessments, and reporting.",
      done: academicYears.length > 0,
      href: "/settings?tab=academic-years",
    },
    {
      title: "Terms",
      description:
        "Set term dates for the year so timetable and assessments know the active window.",
      done: terms.length > 0,
      href: "/settings?tab=terms",
    },
    {
      title: "Classes and streams",
      description:
        "Create classes and streams so learners can be assigned correctly.",
      done: classes.length > 0,
      href: "/settings?tab=classes",
    },
    {
      title: "Assessments",
      description:
        "Capture CBC assessments once classes and terms are ready.",
      done: terms.length > 0 && classes.length > 0,
      href: "/assessments",
    },
  ];

  const quickActions = [
    {
      label: "Configure academic years",
      href: "/settings?tab=academic-years",
      icon: Settings,
      variant: "primary" as const,
    },
    {
      label: "Set terms",
      href: "/settings?tab=terms",
      icon: Calendar,
      variant: "secondary" as const,
    },
    {
      label: "Manage classes",
      href: "/settings?tab=classes",
      icon: Users,
      variant: "secondary" as const,
    },
    {
      label: "Open assessments",
      href: "/assessments",
      icon: ClipboardList,
      variant: "secondary" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Academic quick start</CardTitle>
                <CardDescription>
                  Follow these steps to make timetable and assessments work end to end.
                </CardDescription>
              </div>
              <GraduationCap className="h-8 w-8 text-primary-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {setupSteps.map((step) => (
              <div
                key={step.title}
                className="flex items-start justify-between gap-4 rounded-lg border border-secondary-100 bg-secondary-50/40 p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-secondary-900">
                      {step.title}
                    </h4>
                    <Badge variant={step.done ? "success" : "warning"} size="xs">
                      {step.done ? "Done" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-sm text-secondary-600">{step.description}</p>
                </div>
                <Link href={step.href}>
                  <Button size="sm" variant="secondary">
                    Go
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Current academic year</CardTitle>
                {yearStatus && (
                  <Badge variant={yearStatus.variant}>{yearStatus.label}</Badge>
                )}
              </div>
              <CardDescription>
                {activeYear?.year ? `Year ${activeYear.year}` : "No academic year configured"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeYear ? (
                <div className="space-y-2 text-sm text-secondary-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-secondary-400" />
                    <span>
                      {formatDate(activeYear.start_date)} to{" "}
                      {formatDate(activeYear.end_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-secondary-400" />
                    <span>
                      {activeYear.is_active ? "Active year" : "Not active"}
                    </span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No academic year yet"
                  description="Create a year to unlock terms, timetable, and assessments."
                  action={{ label: "Create academic year", href: "/settings?tab=academic-years" }}
                  className="border-none bg-secondary-50/70"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Current term</CardTitle>
                {termStatus && (
                  <Badge variant={termStatus.variant}>{termStatus.label}</Badge>
                )}
              </div>
              <CardDescription>
                {activeTerm?.name ? `${activeTerm.name}` : "No term configured"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeTerm ? (
                <div className="space-y-2 text-sm text-secondary-700">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-secondary-400" />
                    <span>
                      {formatDate(activeTerm.start_date)} to{" "}
                      {formatDate(activeTerm.end_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-secondary-400" />
                    <span>
                      {activeTerm.is_active ? "Active term" : "Not active"}
                    </span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No term yet"
                  description="Add terms so the system knows the current academic window."
                  action={{ label: "Create terms", href: "/settings?tab=terms" }}
                  className="border-none bg-secondary-50/70"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/settings?tab=academic-years">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Academic years</CardTitle>
              <CardDescription>Track active and historical years.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-3xl font-semibold text-secondary-900">
                {academicYears.length}
              </span>
              <Calendar className="h-8 w-8 text-primary-500" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings?tab=terms">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Terms</CardTitle>
              <CardDescription>Keep term dates and status up to date.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-3xl font-semibold text-secondary-900">
                {terms.length}
              </span>
              <BookOpen className="h-8 w-8 text-primary-500" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings?tab=classes">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Classes</CardTitle>
              <CardDescription>Manage streams and class cohorts.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-3xl font-semibold text-secondary-900">
                {classes.length}
              </span>
              <Users className="h-8 w-8 text-primary-500" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/assessments">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Assessments</CardTitle>
              <CardDescription>Capture learner progress by competency.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-3xl font-semibold text-secondary-900">
                Open
              </span>
              <ClipboardList className="h-8 w-8 text-primary-500" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>
            Jump directly to the most common academic setup tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Button variant={action.variant}>
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
