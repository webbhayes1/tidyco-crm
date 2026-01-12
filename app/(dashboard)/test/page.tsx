export default function TestPage() {
  return (
    <div className="min-h-screen bg-[#F5FBFE] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-tidyco-navy">
            Welcome to TidyCo CRM
          </h1>
          <p className="text-xl text-gray-600">
            Clean, modern, user-friendly portal design
          </p>
        </div>

        {/* Color Palette */}
        <div className="bg-white rounded-xl shadow-tidyco p-8">
          <h2 className="text-2xl font-semibold text-tidyco-navy mb-6">
            TidyCo Brand Colors
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="h-32 bg-[#4BA3E3] rounded-lg shadow-md flex items-center justify-center">
                <span className="text-white font-semibold">TidyCo Blue</span>
              </div>
              <p className="text-sm text-gray-600 text-center">#4BA3E3</p>
            </div>
            <div className="space-y-3">
              <div className="h-32 bg-[#1E3A5F] rounded-lg shadow-md flex items-center justify-center">
                <span className="text-white font-semibold">TidyCo Navy</span>
              </div>
              <p className="text-sm text-gray-600 text-center">#1E3A5F</p>
            </div>
            <div className="space-y-3">
              <div className="h-32 bg-[#E8F4FB] rounded-lg shadow-md flex items-center justify-center border border-gray-200">
                <span className="text-tidyco-navy font-semibold">Light Blue</span>
              </div>
              <p className="text-sm text-gray-600 text-center">#E8F4FB</p>
            </div>
          </div>
        </div>

        {/* Button Samples */}
        <div className="bg-white rounded-xl shadow-tidyco p-8">
          <h2 className="text-2xl font-semibold text-tidyco-navy mb-6">
            Button Styles
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">
              Primary Button
            </button>
            <button className="btn-secondary">
              Secondary Button
            </button>
            <button className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-all">
              Success Button
            </button>
            <button className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-all">
              Danger Button
            </button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="bg-white rounded-xl shadow-tidyco p-8">
          <h2 className="text-2xl font-semibold text-tidyco-navy mb-6">
            Status Badges
          </h2>
          <div className="flex flex-wrap gap-3">
            <span className="badge-success">Active</span>
            <span className="badge-info">Scheduled</span>
            <span className="badge-warning">Pending</span>
            <span className="badge-error">Cancelled</span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-tidyco-navy mb-2">
              Card Title
            </h3>
            <p className="text-gray-600 text-sm">
              Clean card design with subtle shadows and rounded corners.
            </p>
            <button className="btn-primary mt-4">
              Learn More
            </button>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-tidyco-navy mb-2">
              Stat Card
            </h3>
            <div className="text-4xl font-bold text-tidyco-blue mb-2">
              24
            </div>
            <p className="text-sm text-gray-600">
              Total Jobs This Week
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-tidyco-navy mb-2">
              Hover Me
            </h3>
            <p className="text-gray-600 text-sm">
              Card elevation increases on hover with smooth animation.
            </p>
          </div>
        </div>

        {/* Form Elements */}
        <div className="bg-white rounded-xl shadow-tidyco p-8">
          <h2 className="text-2xl font-semibold text-tidyco-navy mb-6">
            Form Elements
          </h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Input
              </label>
              <input
                type="text"
                placeholder="Enter your name..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Dropdown
              </label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Textarea
              </label>
              <textarea
                rows={3}
                placeholder="Enter your message..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-xl shadow-tidyco p-8">
          <h2 className="text-2xl font-semibold text-tidyco-navy mb-6">
            Typography
          </h2>
          <div className="space-y-4">
            <h1 className="text-4xl">Heading 1 - TidyCo Navy</h1>
            <h2 className="text-3xl">Heading 2 - TidyCo Navy</h2>
            <h3 className="text-2xl">Heading 3 - TidyCo Navy</h3>
            <p className="text-gray-600">
              Body text uses gray-600 for optimal readability. All fonts are Apple system fonts
              for a native, professional feel.
            </p>
            <a href="#" className="text-tidyco-blue hover:text-tidyco-blue/80">
              This is a link with TidyCo Blue
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-gray-500 text-sm pt-8">
          <p>TidyCo CRM Design System v1.0</p>
          <p>Clean • Modern • User-Friendly</p>
        </div>
      </div>
    </div>
  );
}
