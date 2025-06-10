import type React from "react"
import { forwardRef } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const DocumentCard = forwardRef<
  HTMLDivElement | HTMLAnchorElement,
  {
    title: string
    description: string
    icon: React.ReactNode
    color: string
    link: string
    onClick?: () => void
    status?: {
      text: string
      color: "default"  | "secondary" | "destructive" | "outline"
    }
  }
>(function DocumentCard({ title, description, icon, color, link, onClick, status }, ref) {
  const Content = (
    <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-col items-center text-center p-6">
        <div className={`rounded-full ${color} bg-opacity-10 p-3 mb-4`}>{icon}</div>
        <CardTitle className={`text-xl font-bold mb-2 ${color}`}>{title}</CardTitle>
        <CardDescription className="text-gray-600">{description}</CardDescription>
        {status && (
          <Badge variant={status.color} className="mt-2">
            {status.text}
          </Badge>
        )}
      </CardHeader>
    </Card>
  )

  if (link === "#") {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        role="button"
        tabIndex={0}
        onClick={onClick}
        className="cursor-pointer transform transition duration-300 hover:scale-105"
      >
        {Content}
      </div>
    )
  }

  return (
    <a
      ref={ref as React.Ref<HTMLAnchorElement>}
      href={link}
      className="cursor-pointer transform transition duration-300 hover:scale-105"
    >
      {Content}
    </a>
  )
})

export default DocumentCard

