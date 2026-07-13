import { Input } from '@/components/ui/input'
import React from 'react'
import { Clock } from 'lucide-react'

interface DatePickerDemoProps {
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
}

const DatePickerDemo: React.FC<DatePickerDemoProps> = ({ value, onChange, id }) => {
  return (
    <div className='w-full'>
      <div className='relative'>
        <div className='absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10'>
          <Clock size={16} className='text-gray-400' />
        </div>
        <Input
          type='time'
          id={id || 'time-picker'}
          step='1'
          value={value ?? ''}
          onChange={e => onChange && onChange(e.target.value)}
          className='w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm bg-white appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-datetime-edit-fields-wrapper]:px-0'
        />
      </div>
    </div>
  )
}

export default DatePickerDemo
