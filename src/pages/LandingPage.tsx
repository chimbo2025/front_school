import React, { useRef, useState } from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  BookOpen, 
  Users, 
  Trophy, 
  Compass, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  ShieldCheck, 
  FileText, 
  Laptop, 
  Palette, 
  Activity,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  Wallet
} from 'lucide-react';
import { schoolConfig, formatNumber, formatTsh } from '../config/schoolConfig';
import { useApp } from '../context/AppContext';
import { GradeFeeAccordion } from '../components/GradeFeeAccordion';

// Generated image assets
import heroImage from '../assets/images/hero_students_3d_1791118488375.jpg';
import innovationLabImg from '../assets/images/campus_innovation_lab_1791118500910.jpg';
import sportsComplexImg from '../assets/images/campus_sports_complex_1791118513151.jpg';
import creativeArtsImg from '../assets/images/campus_creative_arts_1791118525047.jpg';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onOpenFeesModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenFeesModal }) => {
  const { grades } = useApp();
  const [activeFacilityModal, setActiveFacilityModal] = useState<string | null>(null);
  const [openGradeId, setOpenGradeId] = useState<string | null>(grades[0]?.id ?? null);
  const feesSectionRef = useRef<HTMLElement | null>(null);

  const scrollToFees = (gradeId?: string) => {
    const target = gradeId ?? grades[0]?.id ?? null;
    if (target) setOpenGradeId(target);
    requestAnimationFrame(() => {
      feesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const stats = [
    { value: '98%', label: 'Graduate Success', icon: GraduationCap, sub: 'National exams distinction' },
    { value: '20+', label: 'Curricular Programs', icon: BookOpen, sub: 'NECTA & Cambridge blends' },
    { value: '15:1', label: 'Student-Teacher Ratio', icon: Users, sub: 'Personalized attention' },
    { value: '60+', label: 'Extracurriculars', icon: Trophy, sub: 'Sports, robotics, debating' },
    { value: '1,000+', label: 'Thriving Students', icon: Compass, sub: 'From across Zanzibar' },
  ];

  const academicPrograms = [
    {
      id: 'lower',
      title: 'Lower Primary',
      grades: 'Grade 1 - Grade 2',
      color: 'from-teal-600 to-emerald-600',
      tagColor: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: BookOpen,
      desc: 'Nurturing foundational literacy, mathematical reasoning, Kiswahili fluency, and natural curiosity through hands-on exploration.',
      feePreview: 'From 1,925,000 Tsh / year',
    },
    {
      id: 'middle',
      title: 'Middle Primary',
      grades: 'Grade 3 - Grade 4',
      color: 'from-blue-600 to-sky-600',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Laptop,
      desc: 'Expanding inquiry into science experiments, digital computing fundamentals, collaborative projects, and structured sports.',
      feePreview: 'From 2,200,000 Tsh / year',
    },
    {
      id: 'upper',
      title: 'Upper Primary',
      grades: 'Grade 5 - Grade 7',
      color: 'from-amber-600 to-orange-600',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: GraduationCap,
      desc: 'Rigorous academic preparation for national primary leaving examinations, student council leadership, and high school transitions.',
      feePreview: 'Comprehensive package',
    },
    {
      id: 'stem',
      title: 'STEM & Creative Arts',
      grades: 'All Enrolled Grades',
      color: 'from-purple-600 to-indigo-600',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Palette,
      desc: 'Dedicated coding labs, robotics workshops, visual arts studios, and cultural choir building confident well-rounded global thinkers.',
      feePreview: 'Integrated enrichment',
    },
  ];

  const campusFacilities = [
    {
      id: 'innovation',
      title: 'INNOVATION LABS',
      image: innovationLabImg,
      desc: 'Modern tech suite equipped with high-speed computers, interactive smartboards, and robotics kits for future coders.',
      features: ['1:1 Student Computer Ratio', 'Coding & STEM Curriculum', 'Fiber Optic Connectivity'],
    },
    {
      id: 'sports',
      title: 'SPORTS COMPLEX',
      image: sportsComplexImg,
      desc: 'Championship basketball court, artificial turf soccer pitch, and athletics track promoting teamwork and physical health.',
      features: ['FIBA-Standard Basketball Court', 'Junior Turf Soccer Field', 'Professional Athletics Coach'],
    },
    {
      id: 'arts',
      title: 'CREATIVE ARTS STUDIO',
      image: creativeArtsImg,
      desc: 'A vibrant hub for instrumental music, cultural taarab heritage, oil painting, and performing arts performances.',
      features: ['Pianos & String Instruments', 'Visual Art Easels & Ceramics', 'Acoustic Soundproofing'],
    },
  ];

  const journeySteps = [
    {
      step: '1',
      title: 'INQUIRE',
      sub: 'Request Information',
      desc: 'Explore our academic prospectus or speak directly with our admissions officer via phone 0778 407 818.',
    },
    {
      step: '2',
      title: 'APPLY',
      sub: 'Submit Application',
      desc: 'Complete the simple online form in 3 minutes with student details and parent contact information.',
    },
    {
      step: '3',
      title: 'REVIEW',
      sub: 'Interview & Assessment',
      desc: 'Bring your child for a friendly diagnostic interview and assessment with our caring teaching staff.',
    },
    {
      step: '4',
      title: 'ENROLL',
      sub: 'Fee Payment & Enrolment',
      desc: 'Receive official admission notification, pay the admission fee via M-Pesa or Bank, and join our family!',
    },
  ];

  const testimonials = [
    {
      quote: "SEA COAST ACADEMY has transformed my daughter's confidence in English and mathematics. The teachers in Zanzibar are caring, disciplined, and genuinely dedicated to our children's success.",
      author: "Bi Mwanaisha Ali",
      role: "Parent of Amina (Grade 1)",
      location: "Mwanakwerekwe, Unguja",
      avatar: "👩🏾‍💼",
    },
    {
      quote: "The admission process was smooth and completely online. Being able to pay via Mixx by Yas and inspect the fee breakdown transparently gave our family total peace of mind.",
      author: "Mzee Haji Omar",
      role: "Parent of Salim (Grade 2)",
      location: "Chukwani, Zanzibar",
      avatar: "👨🏾‍💼",
    },
    {
      quote: "The robotics and computer lab facilities rival the best international schools in East Africa. Our son comes home excited every single day to talk about his science projects.",
      author: "Bi Fatma Mohamed",
      role: "Parent of Daudi (Grade 3)",
      location: "Mbweni, Zanzibar",
      avatar: "👩🏾",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      {/* HERO SECTION - Inspired by the uploaded visual design */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f2e46] via-[#133e5e] to-[#1c5075] text-white pt-8 pb-16 sm:pb-24 lg:pt-14">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading & CTAs */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-sm font-medium text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admissions Open for Academic Year 2026/2027</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                EMPOWERING <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300">
                  FUTURE LEADERS
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-200 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Inspiring Curiosity, Fostering Innovation, Shaping Tomorrow at{' '}
                <span className="font-semibold text-white">{schoolConfig.name}</span>. 
                A premier centre of primary academic excellence in Zanzibar.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={() => onNavigate('/apply')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-base sm:text-lg group"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onOpenFeesModal}
                  className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 backdrop-blur-xs transition-colors flex items-center justify-center gap-2 text-base sm:text-lg cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-300" />
                  <span>View Fee Structure</span>
                </button>
              </div>

              {/* Trust Subtitle */}
              <div className="pt-2 text-sm text-slate-300 flex items-center justify-center lg:justify-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Places for Grade 1, 2 and 3 are still available. Apply early to secure a place.</span>
              </div>
            </div>

            {/* Right Column: Hero Graphic */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Rounded container with subtle gradient ring */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 bg-slate-800">
                  <img
                    src={heroImage}
                    alt="SEA COAST ACADEMY Students smiling in uniform"
                    className="w-full h-auto object-cover aspect-16/10 transform hover:scale-102 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                  {/* Floating badge inside image */}
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-slate-900/80 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">Admissions Open</div>
                      <div className="text-xs text-slate-300">Academic Year 2026/2027</div>
                    </div>
                    <button
                      onClick={() => onNavigate('/apply')}
                      className="px-3 py-1.5 bg-[#16a34a] hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold shadow-xs"
                    >
                      Start Application
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STATS ROW - Translucent frosted pill/cards matching image design */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className={`bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 sm:p-4 text-center text-white transition-all hover:bg-white/15 hover:-translate-y-0.5 ${
                    idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 mx-auto flex items-center justify-center mb-2 text-emerald-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold tracking-tight font-mono">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-slate-100 mt-0.5">
                    {stat.label}
                  </div>
                  <div className="text-xs text-slate-300 hidden sm:block mt-0.5">
                    {stat.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT SCHOOL SECTION */}
      <section id="about" className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="text-sm font-bold uppercase tracking-wider text-[#16a34a]">
                About Our School
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Rooted in Zanzibar Heritage, Preparing World Citizens
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Founded in 2012 in Unguja, <span className="font-semibold text-slate-800">{schoolConfig.name}</span> offers a rigorous holistic curriculum blending the Tanzanian National NECTA framework with international standards in English, STEM robotics, and character leadership.
              </p>
              <p className="text-base text-slate-600 leading-relaxed">
                We believe that every child in Zanzibar possesses boundless potential. Our classrooms boast a low 15:1 student-to-teacher ratio, ensuring no student is left behind.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-sm font-medium text-slate-700">
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-[#16a34a]" /> Ministry of Education Registered
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-[#16a34a]" /> Qualified Native & Bilingual Faculty
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-[#16a34a]" /> Safe Dedicated School Bus Routes
                </span>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#16a34a] flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Academic Rigor</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Consistently top-ranked in the Unguja educational district with 98% division one pass marks in national assessments.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Laptop className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Digital Literacy</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Every student from Grade 1 participates in weekly computer lab sessions, touch typing, and introductory coding.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-[#7c3aed] flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Sports & Life Skills</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Swimming, football, martial arts, public speaking, and scouting foster resilience, ethics, and team spirit.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Parent Partnership</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Direct communication with teachers, transparent fee schedules, and scheduled termly parent-teacher conferences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACADEMIC EXCELLENCE SECTION - 4 Colorful Cards matching uploaded layout */}
      <section id="programs" className="py-14 sm:py-20 bg-slate-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
              ACADEMIC EXCELLENCE
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-2">
              Comprehensive educational pathways designed to nurture curious, capable, and confident young leaders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {academicPrograms.map((prog) => {
              const Icon = prog.icon;
              return (
                <div
                  key={prog.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
                >
                  {/* Color Banner Header */}
                  <div className={`p-6 bg-gradient-to-br ${prog.color} text-white relative`}>
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 text-white shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold uppercase tracking-wider text-white/80">
                      {prog.grades}
                    </div>
                    <h3 className="text-xl font-bold mt-1 text-white">
                      {prog.title}
                    </h3>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {prog.desc}
                    </p>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        Tuition & Enrolment
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {prog.feePreview}
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        <button
                          onClick={() => onNavigate('/apply')}
                          className="w-full py-2.5 px-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Apply for {prog.title}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => scrollToFees()}
                          className="w-full py-2 px-3 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                          View Fee Breakdown
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATE-OF-THE-ART CAMPUS SECTION - Matches layout with photos */}
      <section id="campus" className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
              STATE-OF-THE-ART CAMPUS
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-2">
              Safe, modern learning spaces purposely engineered to unlock your child's highest creativity and potential.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {campusFacilities.map((facility) => (
              <div
                key={facility.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group"
              >
                {/* Image */}
                <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                  <img
                    src={facility.image}
                    alt={facility.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                    Campus Facility
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      {facility.title}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                      {facility.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    {facility.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-sm text-slate-600">
                        <CheckCircle className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveFacilityModal(facility.id)}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-sm transition-colors cursor-pointer text-center"
                    >
                      View Facility Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* HEAR FROM OUR COMMUNITY - Testimonials */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
              HEAR FROM OUR COMMUNITY
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-2">
              Trusted by hundreds of parents and families across Zanzibar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* 5-star rating */}
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-sm sm:text-base text-slate-700 leading-relaxed italic">
                    "{t.quote}"
                  </blockquote>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-bold text-slate-900">{t.author}</div>
                    <div className="text-sm text-slate-500">{t.role} · {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* READY TO JOIN US BANNER - Dark teal block matching image */}
      <section className="py-12 sm:py-16 bg-[#0f344d] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#114060] to-[#1d5c88] rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-sm font-semibold text-emerald-300 uppercase tracking-widest">
                Academic Year 2026/2027 Registration
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                READY TO JOIN US?
              </h2>
              <p className="text-sm sm:text-base text-slate-200 max-w-xl">
                Apply today to become part of our vibrant learning community in Zanzibar. 
                Slots are limited per classroom.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate('/apply')}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-base sm:text-lg"
              >
                <span>APPLY NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenFeesModal}
                className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-colors text-sm sm:text-base cursor-pointer"
              >
                View Fees Modal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-[#0b1f2e] text-slate-300 pt-12 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
            {/* Col 1 & 2: School info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#16a34a] text-white flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-bold text-white text-lg">
                  {schoolConfig.name}
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Empowering future leaders of Zanzibar with academic rigor, moral character, and digital innovation. Registered under the Ministry of Education and Vocational Training, Zanzibar.
              </p>
              <div className="space-y-1.5 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{schoolConfig.location}, {schoolConfig.island}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a href={`tel:${schoolConfig.phone.replace(/\s+/g, '')}`} className="hover:text-white underline">
                    {schoolConfig.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a href={`mailto:${schoolConfig.email}`} className="hover:text-white underline">
                    {schoolConfig.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Col 3: Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => onNavigate('/')} className="hover:text-white cursor-pointer">Home</button></li>
                <li><button onClick={() => onNavigate('/apply')} className="hover:text-white cursor-pointer">Apply Online</button></li>
                <li><button onClick={onOpenFeesModal} className="hover:text-white cursor-pointer">Fee Structure (Tsh)</button></li>
                <li><button onClick={() => onNavigate('/admin')} className="hover:text-white cursor-pointer">Admin Staff Portal</button></li>
              </ul>
            </div>

            {/* Col 4: Academics */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                Grades Offered
              </h4>
              <ul className="space-y-2 text-sm">
                {grades.map((g) => (
                  <li key={g.id}>
                    <button 
                      onClick={() => scrollToFees(g.id)} 
                      className="hover:text-white cursor-pointer"
                    >
                      {g.name} Curriculum & Fees
                    </button>
                  </li>
                ))}
                <li><span className="text-slate-500">STEM & Robotics Club</span></li>
                <li><span className="text-slate-500">Extracurricular Sports</span></li>
              </ul>
            </div>

            {/* Col 5: Payment Channels */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                School Fee Channels
              </h4>
              <p className="text-sm text-slate-400 mb-2">
                Accepted methods for fee payments:
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="bg-slate-800/80 px-2.5 py-1 rounded text-slate-300">📱 Mixx by Yas (Zantel)</div>
                <div className="bg-slate-800/80 px-2.5 py-1 rounded text-slate-300">🔴 Vodacom M-Pesa</div>
                <div className="bg-slate-800/80 px-2.5 py-1 rounded text-slate-300">⚪ Airtel Money</div>
                <div className="bg-slate-800/80 px-2.5 py-1 rounded text-slate-300">🏦 PBZ & CRDB Bank</div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-3">
            <div>
              © {new Date().getFullYear()} {schoolConfig.name}. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Zanzibar, Tanzania</span>
              <span>·</span>
              <button onClick={() => onNavigate('/admin')} className="text-slate-400 hover:text-white underline">
                Staff Admin Portal
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Facility Details Modal */}
      {activeFacilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in">
            {(() => {
              const fac = campusFacilities.find((f) => f.id === activeFacilityModal);
              if (!fac) return null;
              return (
                <div>
                  <div className="relative aspect-16/10">
                    <img src={fac.image} alt={fac.title} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setActiveFacilityModal(null)}
                      className="absolute top-3 right-3 bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 rounded-full"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="text-lg font-bold text-slate-900">{fac.title}</h3>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{fac.desc}</p>
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="text-sm font-semibold text-slate-700">Facility Highlights:</div>
                      {fac.features.map((f, i) => (
                        <div key={i} className="text-sm text-slate-600 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-[#16a34a]" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3">
                      <button
                        onClick={() => {
                          setActiveFacilityModal(null);
                          onNavigate('/apply');
                        }}
                        className="w-full py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-semibold hover:bg-[#6d28d9]"
                      >
                        Apply for Admission Today
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};