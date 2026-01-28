import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <div className="text-center space-y-6 max-w-md">
                <h1 className="text-9xl font-bold text-primary">404</h1>
                <h2 className="text-2xl font-semibold">Page Not Found</h2>
                <p className="text-muted-foreground">
                    The page you are looking for doesn't exist or has been moved.
                    If you are developing locally, make sure you are at the root URL.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button asChild variant="default">
                        <Link href="/">Go to Home</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/packmaker/">Try /packmaker/</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
