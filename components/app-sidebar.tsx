"use client"

import { History, Home, Settings, Video } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const { theme } = useTheme()
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center px-4 py-4">
        <Video className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Text2Video</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/" || pathname === ""}>
              <Link href="/">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/#gallery"}>
              <Link
                href="/#gallery"
                onClick={(e) => {
                  e.preventDefault()
                  // Force tab change to the gallery tab
                  const galleryTab = document.querySelector('[data-tab="gallery"]')
                  if (galleryTab) {
                    ;(galleryTab as HTMLElement).click()
                    // Update URL hash
                    window.history.pushState({}, "", "/#gallery")
                  }
                }}
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/#settings"}>
              <Link
                href="/#settings"
                onClick={(e) => {
                  e.preventDefault()
                  // Scroll to API key section
                  const apiKeySection = document.getElementById("api-key-section")
                  if (apiKeySection) {
                    apiKeySection.scrollIntoView({ behavior: "smooth" })

                    // Force expand the API key form
                    const expandApiKeyForm = () => {
                      const clickableHeader = apiKeySection.querySelector(".flex.items-center.gap-2.cursor-pointer")
                      if (clickableHeader) {
                        // Check if it's already expanded
                        const isCurrentlyExpanded = apiKeySection.querySelector(".flex.items-center.gap-2")
                        if (!isCurrentlyExpanded || !apiKeySection.querySelector("input")) {
                          ;(clickableHeader as HTMLElement).click()
                        }
                      }
                    }

                    // Give it a moment to ensure the DOM is ready
                    setTimeout(expandApiKeyForm, 100)
                  }
                }}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">
          <p className="mb-1">
            Powered by{" "}
            <a
              href="https://api.market/store/magicapi/wan-text-to-image"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 dark:hover:text-white transition-colors"
            >
              Wan Text-to-Video API
            </a>
          </p>
          <p className="text-[10px]">
            from{" "}
            <a
              href="https://api.market"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 dark:hover:text-white transition-colors"
            >
              API.market
            </a>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

