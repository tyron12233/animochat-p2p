import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                },
                'color-1': 'hsl(var(--color-1))',
                'color-2': 'hsl(var(--color-2))',
                'color-3': 'hsl(var(--color-3))',
                'color-4': 'hsl(var(--color-4))',
                'color-5': 'hsl(var(--color-5))'
            },
            keyframes: {
                 float: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)', opacity: '1' },
          '50%': { transform: 'translateY(-10px) scale(1.05)', opacity: '0.8' },
        },
                'accordion-down': {
                    from: {
                        height: '0'
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)'
                    }
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)'
                    },
                    to: {
                        height: '0'
                    }
                },
                'aurora-border': {
                    '0%, 100%': {
                        borderRadius: '37% 29% 27% 27% / 28% 25% 41% 37%'
                    },
                    '25%': {
                        borderRadius: '47% 29% 39% 49% / 61% 19% 66% 26%'
                    },
                    '50%': {
                        borderRadius: '57% 23% 47% 72% / 63% 17% 66% 33%'
                    },
                    '75%': {
                        borderRadius: '28% 49% 29% 100% / 93% 20% 64% 25%'
                    }
                },
                'aurora-1': {
                    '0%, 100%': {
                        top: '0',
                        right: '0'
                    },
                    '50%': {
                        top: '50%',
                        right: '25%'
                    },
                    '75%': {
                        top: '25%',
                        right: '50%'
                    }
                },
                'aurora-2': {
                    '0%, 100%': {
                        top: '0',
                        left: '0'
                    },
                    '60%': {
                        top: '75%',
                        left: '25%'
                    },
                    '85%': {
                        top: '50%',
                        left: '50%'
                    }
                },
                'aurora-3': {
                    '0%, 100%': {
                        bottom: '0',
                        left: '0'
                    },
                    '40%': {
                        bottom: '50%',
                        left: '25%'
                    },
                    '65%': {
                        bottom: '25%',
                        left: '50%'
                    }
                },
                'aurora-4': {
                    '0%, 100%': {
                        bottom: '0',
                        right: '0'
                    },
                    '50%': {
                        bottom: '25%',
                        right: '40%'
                    },
                    '90%': {
                        bottom: '50%',
                        right: '25%'
                    }
                },
                marquee: {
                    from: {
                        transform: 'translateX(0)'
                    },
                    to: {
                        transform: 'translateX(calc(-100% - var(--gap)))'
                    }
                },
                'marquee-vertical': {
                    from: {
                        transform: 'translateY(0)'
                    },
                    to: {
                        transform: 'translateY(calc(-100% - var(--gap)))'
                    }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                float: 'float 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'accordion-up': 'accordion-up 0.2s ease-out',
                marquee: 'marquee var(--duration) infinite linear',
                'marquee-vertical': 'marquee-vertical var(--duration) linear infinite'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
