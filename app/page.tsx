import { AppSidebar } from "@/components/app-sidebar"
import { ApiKeyForm } from "@/components/api-key-form"
import { GeneratorDashboard } from "@/components/generator-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function Home() {
  return (
    <main className="flex min-h-screen bg-background">
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger />
          <div className="flex-1 font-semibold">Text to Video Generator</div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/Noveum/wan-text-to-video-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 dark:hover:text-white transition-colors mr-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              GitHub
            </a>
            <a
              href="https://api.market/store/magicapi/wan-text-to-image"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary/80 dark:hover:text-white transition-colors mr-2"
            >
              Powered by API.market
            </a>
            <ThemeToggle />
          </div>
        </header>
        <div className="container py-6">
          <ApiKeyForm />
          <GeneratorDashboard />
        </div>
      </SidebarInset>
    </main>
  )
}

