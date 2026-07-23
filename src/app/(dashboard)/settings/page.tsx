'use client'

import { useAuth } from '@/components/shared/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Globe, Moon, Clock, FileText, Code, Radio, ScrollText, Bell, Mail, Smartphone, Download, Trash2, Sliders, Info, ExternalLink, Loader2, Brain } from 'lucide-react'
import { t } from '@/lib/i18n'
import { useAppStore, type Lang } from '@/store/app-store'
import { useTheme } from '@/components/shared/ThemeProvider'
import { createClient } from '@/lib/supabase/client'

interface SettingRowProps {
  icon: React.ElementType
  label: string
  description?: string
  action: React.ReactNode
}

function SettingRow({ icon: Icon, label, description, action }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-gray-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4.5' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { session, isLoading } = useAuth()
  const router = useRouter()
  const { language, setLanguage } = useAppStore()
  const { theme, toggleTheme } = useTheme()
  const supabase = createClient()

  useEffect(() => {
    if (!isLoading && !session) router.push('/login')
  }, [isLoading, session, router])

  if (isLoading || !session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const handleLanguageChange = async () => {
    const next: Lang = language === 'en' ? 'bn' : 'en'
    setLanguage(next)
    try {
      await supabase.from('profiles').upsert({ id: session.user.id, preferred_lang: next })
    } catch {}
  }

  const sections = [
    {
      id: 'general',
      title: t('settings.general'),
      items: [
        {
          icon: Globe,
          label: t('settings.language'),
          description: language === 'en' ? 'English' : 'বাংলা',
          action: (
            <button
              onClick={handleLanguageChange}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {language === 'en' ? 'বাংলা' : 'English'}
            </button>
          ),
        },
        {
          icon: Moon,
          label: t('settings.theme'),
          description: theme === 'light' ? 'Light' : 'Dark',
          action: (
            <button
              onClick={toggleTheme}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          ),
        },
        {
          icon: Clock,
          label: t('settings.timezone'),
          description: Intl.DateTimeFormat().resolvedOptions().timeZone,
          action: <span className="text-xs text-gray-500 dark:text-gray-400">{t('profile.coming_soon')}</span>,
        },
      ],
    },
    {
      id: 'chat',
      title: t('settings.chat'),
      items: [
        {
          icon: Brain,
          label: 'Long-Term Memory Engine',
          description: 'View and manage what JHS One AI remembers about you',
          action: (
            <button
              onClick={() => router.push('/settings/memory')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Manage Memory
            </button>
          ),
        },
        {
          icon: Radio,
          label: t('settings.response_style'),
          action: <span className="text-xs text-gray-500 dark:text-gray-400">{t('profile.coming_soon')}</span>,
        },
        {
          icon: FileText,
          label: t('settings.markdown'),
          action: <Toggle checked={true} onChange={() => {}} />,
        },
        {
          icon: Code,
          label: t('settings.code_blocks'),
          action: <Toggle checked={true} onChange={() => {}} />,
        },
        {
          icon: Radio,
          label: t('settings.streaming'),
          action: <Toggle checked={true} onChange={() => {}} />,
        },
        {
          icon: ScrollText,
          label: t('settings.auto_scroll'),
          action: <Toggle checked={true} onChange={() => {}} />,
        },
      ],
    },
    {
      id: 'notifications',
      title: t('settings.notifications'),
      items: [
        {
          icon: Bell,
          label: t('settings.desktop'),
          action: <Toggle checked={false} onChange={() => {}} />,
        },
        {
          icon: Mail,
          label: t('settings.email'),
          action: <span className="text-xs text-gray-500 dark:text-gray-400">{t('profile.coming_soon')}</span>,
        },
        {
          icon: Smartphone,
          label: t('settings.push'),
          action: <span className="text-xs text-gray-500 dark:text-gray-400">{t('profile.coming_soon')}</span>,
        },
      ],
    },
    {
      id: 'privacy',
      title: t('settings.privacy'),
      items: [
        {
          icon: Download,
          label: t('settings.export_chats'),
          action: (
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open('/api/conversations/export?format=json', '_blank')}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 bg-blue-50 dark:bg-blue-950/40 rounded"
              >
                JSON
              </button>
              <button
                onClick={() => window.open('/api/conversations/export?format=markdown', '_blank')}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 bg-blue-50 dark:bg-blue-950/40 rounded"
              >
                Markdown
              </button>
            </div>
          ),
        },
        {
          icon: Trash2,
          label: t('settings.delete_history'),
          action: <span className="text-xs text-gray-500 dark:text-gray-400">{t('profile.coming_soon')}</span>,
        },
        {
          icon: Sliders,
          label: t('settings.data_controls'),
          action: <span className="text-xs text-gray-500 dark:text-gray-400">{t('profile.coming_soon')}</span>,
        },
      ],
    },
    {
      id: 'about',
      title: t('settings.about'),
      items: [
        {
          icon: Info,
          label: 'JHS One AI',
          description: `${t('settings.powered_by')} JH Soft Corporation`,
          action: null,
        },
        {
          icon: Info,
          label: t('settings.founder'),
          description: 'Md. Junayed Hossain Anik',
          action: null,
        },
        {
          icon: Info,
          label: t('settings.version'),
          description: '1.0.0',
          action: null,
        },
        {
          icon: Globe,
          label: t('settings.website'),
          action: (
            <a
              href="https://jhsoftcorp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ),
        },
        {
          icon: ExternalLink,
          label: t('settings.github'),
          action: (
            <a
              href="https://github.com/jhsone/jhs-one-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ),
        },
      ],
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('settings.title')}</h1>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {section.items.map((item) => (
                  <SettingRow key={item.label} icon={item.icon} label={item.label} description={item.description} action={item.action} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer branding */}
        <div className="text-center mt-10 mb-6">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            JHS One AI &mdash; {t('settings.powered_by')} JH Soft Corporation
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            &copy; {new Date().getFullYear()} JH Soft Corporation. {t('settings.terms')}.
          </p>
        </div>
      </div>
    </div>
  )
}
