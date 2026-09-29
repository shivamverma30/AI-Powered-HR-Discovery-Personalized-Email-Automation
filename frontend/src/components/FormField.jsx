// Simple labeled input with optional error and help text.
export default function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  help,
  required = false,
  type = 'text',
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand/30 ${
          error ? 'border-red-400' : 'border-slate-300'
        }`}
      />
      {help && !error && <p className="mt-1 text-xs text-slate-500">{help}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
