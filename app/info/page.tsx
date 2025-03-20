import Link from "next/link"
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function InfoPage() {
  return (
    <div className="container max-w-3xl py-10">
      <Link href="/" className="flex items-center text-primary hover:text-primary/80 dark:hover:text-white mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Generator
      </Link>

      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Important Information
          </CardTitle>
          <CardDescription>
            Please be aware of the following limitations when using the Text to Video Generator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              Request Expiration
            </h3>
            <p className="text-muted-foreground">
              All generation requests are automatically deleted after <strong>30 minutes</strong>. If you check the
              status of a request after this time period, you may receive an error message indicating the request cannot
              be found.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              Video Expiration
            </h3>
            <p className="text-muted-foreground">
              All generated videos are stored on our CDN for <strong>24 hours</strong> only. After this period, video
              URLs will no longer work. If you want to keep your videos, please download them as soon as they are
              generated.
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md border border-amber-200 dark:border-amber-900">
            <p className="text-amber-800 dark:text-amber-300 text-sm">
              <strong>Recommendation:</strong> Download your videos immediately after generation to ensure you don't
              lose them. You can use the "Download Video" button that appears with each completed video.
            </p>
          </div>

          <div className="pt-4">
            <Button asChild className="button-primary">
              <Link href="/">Return to Generator</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

