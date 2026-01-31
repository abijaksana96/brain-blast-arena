import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from './Button';
import {
    BrainCircuit,
    Zap,
    Users,
    Timer,
    Bell,
    Target,
    Trophy,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    Award
} from 'lucide-react';

interface BriefingSlidesProps {
    onComplete: () => void;
    onStopAudioRef?: (fn: (() => void) | null) => void;
}

interface SlideContentItem {
    icon: React.ReactNode;
    text: string;
    highlight?: boolean;
}

interface Slide {
    id: number;
    title: string;
    subtitle?: string;
    items: SlideContentItem[];
    accentColor: string;
    playSound?: boolean;
}

const SLIDES: Slide[] = [
    {
        id: 0,
        title: 'BRAIN BLAST',
        subtitle: 'Selamat Datang',
        playSound: true,
        accentColor: 'blue',
        items: [],
    },
    {
        id: 1,
        title: 'BRAIN BLAST',
        subtitle: 'Gambaran Umum',
        playSound: true,
        accentColor: 'blue',
        items: [
            { icon: <Users className="w-5 h-5" />, text: 'Babak final diikuti oleh 10 tim terbaik hasil seleksi semifinal' },
            { icon: <Target className="w-5 h-5" />, text: 'Dilaksanakan secara luring dengan dua ronde utama: Five Trials & Brain Blast' },
            { icon: <Trophy className="w-5 h-5" />, text: 'Skor kedua ronde diakumulasikan untuk menentukan 5 tim terbaik menuju Grand Final', highlight: true },
            { icon: <Zap className="w-5 h-5" />, text: 'Konsep "Ledakan Otak": Adu cepat, adu ketepatan, adu strategi' },
            { icon: <Bell className="w-5 h-5" />, text: 'Menggunakan sistem "tekan bel" — tim tercepat berhak menjawab' },
            { icon: <Timer className="w-5 h-5" />, text: 'Setiap soal ditampilkan di layar selama 3 menit' },
        ],
    },
    {
        id: 2,
        title: 'KETENTUAN LOMBA',
        subtitle: 'Umum & Soal',
        accentColor: 'emerald',
        items: [
            { icon: <Users className="w-5 h-5" />, text: 'Jumlah peserta: 10 tim' },
            { icon: <Target className="w-5 h-5" />, text: 'Total 15 soal isian singkat' },
            { icon: <CheckCircle className="w-5 h-5" />, text: '10 soal mudah → 5 poin per soal', highlight: true },
            { icon: <Zap className="w-5 h-5" />, text: '5 soal sulit → 10 poin per soal', highlight: true },
            { icon: <Trophy className="w-5 h-5" />, text: 'Skor maksimal yang dapat diraih: 100 poin' },
            { icon: <Clock className="w-5 h-5" />, text: 'Setiap soal ditampilkan selama 3 menit' },
        ],
    },
    {
        id: 3,
        title: 'KETENTUAN LOMBA',
        subtitle: 'Sistem Bel & Menjawab',
        accentColor: 'amber',
        items: [
            { icon: <Bell className="w-5 h-5" />, text: 'Disediakan 5 bel untuk 10 tim, satu bel di antara dua tim' },
            { icon: <Zap className="w-5 h-5" />, text: 'Tim yang menekan bel paling cepat berhak menjawab', highlight: true },
            { icon: <Timer className="w-5 h-5" />, text: 'Tim wajib menjawab dalam waktu maksimal 5 detik' },
            { icon: <XCircle className="w-5 h-5" />, text: 'Jika jawaban salah atau tidak menjawab → soal langsung hangus' },
        ],
    },
    {
        id: 4,
        title: 'KETENTUAN LOMBA',
        subtitle: 'Penilaian & Kelulusan',
        accentColor: 'purple',
        items: [
            { icon: <CheckCircle className="w-5 h-5" />, text: 'Jawaban benar → mendapat poin sesuai bobot soal' },
            { icon: <XCircle className="w-5 h-5" />, text: 'Jawaban salah / tidak menjawab → pengurangan poin sesuai bobot soal' },
            { icon: <Clock className="w-5 h-5" />, text: 'Soal yang tidak dijawab hingga waktu habis → hangus (tidak ada penambahan/pengurangan)' },
            { icon: <Target className="w-5 h-5" />, text: 'Skor ronde Brain Blast diakumulasikan dengan skor Five Trials' },
            { icon: <Trophy className="w-5 h-5" />, text: '5 tim dengan skor tertinggi lolos ke Grand Final', highlight: true },
            { icon: <Award className="w-5 h-5" />, text: 'Jika terjadi seri poin, dilakukan playoff' },
        ],
    },
];

const getAccentClasses = (color: string) => {
    const classes: Record<string, { bg: string; border: string; text: string; gradient: string; shadow: string }> = {
        blue: {
            bg: 'bg-blue-500/20',
            border: 'border-blue-500/50',
            text: 'text-blue-400',
            gradient: 'from-blue-600 to-indigo-600',
            shadow: 'shadow-blue-500/20',
        },
        emerald: {
            bg: 'bg-emerald-500/20',
            border: 'border-emerald-500/50',
            text: 'text-emerald-400',
            gradient: 'from-emerald-600 to-teal-600',
            shadow: 'shadow-emerald-500/20',
        },
        amber: {
            bg: 'bg-amber-500/20',
            border: 'border-amber-500/50',
            text: 'text-amber-400',
            gradient: 'from-amber-600 to-orange-600',
            shadow: 'shadow-amber-500/20',
        },
        purple: {
            bg: 'bg-purple-500/20',
            border: 'border-purple-500/50',
            text: 'text-purple-400',
            gradient: 'from-purple-600 to-pink-600',
            shadow: 'shadow-purple-500/20',
        },
    };
    return classes[color] || classes.blue;
};

// Audio fade helpers (duration in ms)
const fadeIn = (audio: HTMLAudioElement, target = 0.5, duration = 800) => {
    try {
        audio.volume = 0;
        audio.play().catch(() => { });
        const step = target / Math.max(1, Math.round(duration / 50));
        const iv = window.setInterval(() => {
            audio.volume = Math.min(target, audio.volume + step);
            if (audio.volume >= target) {
                clearInterval(iv);
            }
        }, 50);
        return iv;
    } catch (e) {
        return null as unknown as number;
    }
};

const fadeOut = (audio: HTMLAudioElement, duration = 600) => {
    try {
        const steps = Math.max(1, Math.round(duration / 50));
        const step = audio.volume / steps;
        const iv = window.setInterval(() => {
            audio.volume = Math.max(0, audio.volume - step);
            if (audio.volume <= 0) {
                audio.pause();
                audio.currentTime = 0;
                clearInterval(iv);
            }
        }, 50);
        return iv;
    } catch (e) {
        return null as unknown as number;
    }
};

export const BriefingSlides: React.FC<BriefingSlidesProps> = ({ onComplete, onStopAudioRef }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [visibleItems, setVisibleItems] = useState<number[]>([]);
    const [slideEntered, setSlideEntered] = useState(false);

    const slide = SLIDES[currentSlide];
    const accent = getAccentClasses(slide.accentColor);
    const isLastSlide = currentSlide === SLIDES.length - 1;
    const isFirstSlide = currentSlide === 0;
    // Single briefing audio owned by this component
    const bgAudioRef = React.useRef<HTMLAudioElement | null>(null);
    const fadeIvRef = React.useRef<number | null>(null);

    const stopAudioHard = () => {
        try {
            if (fadeIvRef.current) {
                clearInterval(fadeIvRef.current);
                fadeIvRef.current = null;
            }
            if (bgAudioRef.current) {
                bgAudioRef.current.pause();
                bgAudioRef.current.currentTime = 0;
                bgAudioRef.current.volume = 0;
                bgAudioRef.current = null;
            }
        } catch (e) { }
    };

    // Expose stop helper to parent so App can stop briefing audio prematurely
    useEffect(() => {
        if (!onStopAudioRef) return;
        onStopAudioRef(() => {
            stopAudioHard();
        });
        return () => { onStopAudioRef(null); };
    }, [onStopAudioRef]);

    // Memoize orb positions so they don't change on every render
    const orbPositions = useMemo(() => {
        return [...Array(6)].map((_, i) => ({
            width: 200 + (i * 50) % 150,
            height: 200 + (i * 70) % 150,
            left: (i * 17) % 100,
            top: (i * 23) % 100,
            delay: i * 0.5,
            duration: 3 + (i % 3),
        }));
    }, []);

    // Reset and animate items when slide changes
    useEffect(() => {
        setVisibleItems([]);
        setSlideEntered(false);

        // Slide entrance animation
        const entranceTimer = setTimeout(() => {
            setSlideEntered(true);
        }, 50);

        // Staggered item animations - start after slide enters
        const itemTimers: ReturnType<typeof setTimeout>[] = [];
        slide.items.forEach((_, index) => {
            const timer = setTimeout(() => {
                setVisibleItems(prev => [...prev, index]);
            }, 300 + index * 120);
            itemTimers.push(timer);
        });

        return () => {
            clearTimeout(entranceTimer);
            itemTimers.forEach(timer => clearTimeout(timer));
        };
    }, [currentSlide, slide.items]);

    // BRIEFING lifecycle: create/play+fade-in on mount, stop on unmount
    useEffect(() => {
        // create single audio for whole briefing
        try {
            const audio = new Audio('/breaking-news-report-tension-flash-434566.mp3');
            audio.loop = true;
            audio.preload = 'auto';
            audio.volume = 0;
            bgAudioRef.current = audio;

            // fade in to target volume 0.6 over ~20 steps
            const steps = 20;
            let i = 0;
            fadeIvRef.current = window.setInterval(() => {
                if (!bgAudioRef.current) return;
                i++;
                bgAudioRef.current.volume = Math.min(0.6, (i / steps) * 0.6);
                if (i >= steps && fadeIvRef.current) {
                    clearInterval(fadeIvRef.current);
                    fadeIvRef.current = null;
                }
            }, 50) as unknown as number;

            audio.play().catch(() => { });
        } catch (e) {
            // ignore
        }

        return () => {
            stopAudioHard();
        };
    }, []);

    // Exit briefing by fading out then stopping and calling onComplete
    const exitBriefing = useCallback(() => {
        if (!bgAudioRef.current) {
            onComplete();
            return;
        }

        const steps = 15;
        let i = steps;
        // clear any existing fade
        if (fadeIvRef.current) {
            clearInterval(fadeIvRef.current);
            fadeIvRef.current = null;
        }
        fadeIvRef.current = window.setInterval(() => {
            if (!bgAudioRef.current) return;
            i--;
            bgAudioRef.current.volume = Math.max(0, (i / steps) * 0.6);
            if (i <= 0) {
                stopAudioHard();
                if (fadeIvRef.current) {
                    clearInterval(fadeIvRef.current);
                    fadeIvRef.current = null;
                }
                onComplete();
            }
        }, 50) as unknown as number;
    }, [onComplete]);

    const handleNext = useCallback(() => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setSlideEntered(false);
        setVisibleItems([]);

        setTimeout(() => {
            if (isLastSlide) {
                // fade out and exit briefing
                exitBriefing();
            } else {
                setCurrentSlide(prev => prev + 1);
            }
            setIsTransitioning(false);
        }, 300);
    }, [isLastSlide, isTransitioning, exitBriefing]);

    const handlePrev = useCallback(() => {
        if (isTransitioning || isFirstSlide) return;

        setIsTransitioning(true);
        setSlideEntered(false);
        setVisibleItems([]);

        setTimeout(() => {
            setCurrentSlide(prev => Math.max(0, prev - 1));
            setIsTransitioning(false);
        }, 300);
    }, [isFirstSlide, isTransitioning]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
            }
            if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
                e.preventDefault();
                handlePrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev]);

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
                        backgroundSize: '50px 50px'
                    }}
                />

                {/* Floating orbs */}
                {orbPositions.map((orb, i) => (
                    <div
                        key={i}
                        className={`absolute rounded-full blur-3xl opacity-20 animate-pulse ${accent.bg}`}
                        style={{
                            width: orb.width,
                            height: orb.height,
                            left: `${orb.left}%`,
                            top: `${orb.top}%`,
                            animationDelay: `${orb.delay}s`,
                            animationDuration: `${orb.duration}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main content */}
            <div className={`relative z-10 h-full flex flex-col items-center justify-center p-6 lg:p-12 transition-all duration-300 ease-out ${slideEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>

                {/* Header - hide on landing page */}
                {currentSlide > 0 && (
                    <div className="text-center mb-8 lg:mb-12">
                        <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${accent.bg} ${accent.border} border mb-4`}>
                            <BrainCircuit className={`w-5 h-5 ${accent.text}`} />
                            <span className={`text-sm font-bold uppercase tracking-widest ${accent.text}`}>
                                {slide.subtitle || 'Brain Blast'}
                            </span>
                        </div>

                        <h1 className={`text-4xl lg:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r ${accent.gradient} pb-2`}>
                            {slide.title}
                        </h1>

                        {currentSlide === 1 && (
                            <p className="text-slate-400 mt-2 text-sm lg:text-base max-w-xl mx-auto">
                                Selamat datang di babak Brain Blast! Berikut adalah gambaran umum dan ketentuan lomba.
                            </p>
                        )}
                    </div>
                )}

                {/* Landing page content */}
                {currentSlide === 0 && (
                    <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
                        {/* Large Brain Icon */}
                        <div className={`w-32 h-32 lg:w-40 lg:h-40 rounded-3xl bg-gradient-to-br ${accent.gradient} flex items-center justify-center mb-8 shadow-2xl ${accent.shadow} animate-pulse`}>
                            <BrainCircuit className="w-16 h-16 lg:w-20 lg:h-20 text-white" />
                        </div>

                        {/* Welcome Text */}
                        <h2 className="text-2xl lg:text-4xl font-display font-bold text-white mb-4">
                            Selamat Datang di Babak
                        </h2>
                        <h1 className={`text-5xl lg:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r ${accent.gradient} mb-6`}>
                            BRAIN BLAST
                        </h1>

                        {/* Tagline */}
                        <p className="text-lg lg:text-xl text-slate-400 mb-8 max-w-lg">
                            Adu cepat, adu ketepatan, adu strategi.<br />
                            Siapkan diri Anda untuk ledakan otak!
                        </p>

                        {/* Decorative elements */}
                        <div className="flex items-center gap-4 text-slate-500">
                            <Zap className={`w-6 h-6 ${accent.text}`} />
                            <span className="text-sm uppercase tracking-widest">Tekan tombol untuk melanjutkan</span>
                            <Zap className={`w-6 h-6 ${accent.text}`} />
                        </div>
                    </div>
                )}

                {/* Cards container - only show when slide has items */}
                {slide.items.length > 0 && (
                    <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8 mb-8">
                        {slide.items.map((item, index) => (
                            <div
                                key={`${currentSlide}-${index}`}
                                className={`transition-all duration-300 ease-out ${visibleItems.includes(index)
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 translate-y-4'
                                    }`}
                            >
                                <div className={`
                relative p-5 lg:p-7 rounded-2xl 
                bg-slate-900/80 backdrop-blur-sm
                border-2 ${accent.border}
                shadow-xl ${accent.shadow}
                hover:scale-[1.02] hover:shadow-2xl
                transition-all duration-300
                group
              `}>
                                    {/* Glow effect */}
                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${accent.gradient} opacity-10 blur-sm`} />

                                    <div className="relative flex items-start gap-5">
                                        <div className={`
                    flex-none w-14 h-14 rounded-xl 
                    flex items-center justify-center
                    bg-gradient-to-br ${accent.gradient}
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                                            <div className="text-white [&>svg]:w-7 [&>svg]:h-7">
                                                {item.icon}
                                            </div>
                                        </div>

                                        <p className="text-base lg:text-lg leading-relaxed text-white font-medium flex-1">
                                            {item.text}
                                        </p>
                                    </div>

                                    {/* Number badge */}
                                    <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center shadow-lg`}>
                                        <span className="text-sm font-bold text-white">{index + 1}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Prev button only */}
                <div className="absolute bottom-6 left-6">
                    <Button
                        onClick={handlePrev}
                        size="sm"
                        variant="secondary"
                        className={`flex items-center gap-2 ${isFirstSlide ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        KEMBALI
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BriefingSlides;
