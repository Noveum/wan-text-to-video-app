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

