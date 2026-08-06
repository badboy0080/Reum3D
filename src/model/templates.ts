import type { Project, TemplateId } from './types'
import { createDefaultProject } from './defaults'

export const TEMPLATES: {
  id: TemplateId
  label: string
  blurb: string
}[] = [
  {
    id: 'narrative',
    label: '叙事卷轴',
    blurb: '适合个人故事：首页 → 简介 → 作品 → 联系',
  },
  {
    id: 'showcase',
    label: '作品展台',
    blurb: '更强调作品与特写镜头，适合作品集',
  },
]

/** Apply template defaults onto an existing project (keeps title/id). */
export function applyTemplate(project: Project, templateId: TemplateId): Project {
  const fresh = createDefaultProject(templateId)
  return {
    ...project,
    templateId,
    theme: { ...project.theme, ...fresh.theme },
    characterId: project.characterId,
    pages: fresh.pages.map((page, i) => {
      const prev = project.pages[i]
      if (!prev || prev.kind === 'custom') return page
      return {
        ...page,
        // keep user edits to titles/tags/texts when same kind exists
        title: prev.title || page.title,
        tag: prev.tag || page.tag,
        texts: prev.texts?.length ? prev.texts : page.texts,
        hidden: prev.hidden,
        backgroundPresetId:
          prev.backgroundPresetId ?? page.backgroundPresetId,
        imageCardGroups: prev.imageCardGroups?.length
          ? prev.imageCardGroups
          : page.imageCardGroups,
      }
    }),
  }
}
