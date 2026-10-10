import { type Field } from 'payload'

import { DubColors } from '../types.js'

export function getTags(): Field[] {
  return [
    {
      name: 'tagID',
      type: 'text',
      access: {
        read: () => true,
        update: () => true,
      },
      admin: {
        readOnly: true,
      },
      label: 'Tag ID',
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'color',
      type: 'select',
      options: Object.values(DubColors).map((color) => ({
        label: color.charAt(0).toUpperCase() + color.slice(1),
        value: color,
      })),
      required: true,
    },
  ]
}
