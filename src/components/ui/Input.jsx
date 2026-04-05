export default function Input({
  label,
  error,
  required,
  className = '',
  id,
  prefix,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-lg border ${error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} bg-white px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${prefix ? 'pl-8' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
