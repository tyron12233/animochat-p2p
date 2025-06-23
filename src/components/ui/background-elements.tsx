export default function BackgroundElements() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-5">
            {/* Floating Circles */}
            <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-r from-green-100 to-green-50 rounded-full opacity-50 animate-float mix-blend-multiply"></div>

            {/* Animated Blobs */}
            <div className="absolute top-1/3 right-32 w-48 h-48 bg-green-100 rounded-full opacity-20 animate-blob animation-delay-2000"></div>

            {/* Floating Squares */}
            <div className="absolute top-2/3 left-16 w-16 h-16 bg-green-50 rotate-45 opacity-30 animate-float animation-delay-3000"></div>

            {/* Pulse Elements */}
            <div className="absolute bottom-32 right-1/4">
                <div className="w-32 h-32 border-4 border-green-100 rounded-full animate-pulse opacity-30"></div>
            </div>

            {/* Abstract Grid Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            {/* Animated Lines */}
            <div className="absolute top-0 left-0 w-1/3 h-full animate-line">
                <div className="w-px h-full bg-gradient-to-b from-transparent via-green-100 to-transparent"></div>
            </div>
        </div>
    )
}
