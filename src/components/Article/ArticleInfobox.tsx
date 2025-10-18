interface InfoboxProps {
  title: string;
  url?: string;
  data?: {
    label: string;
    value: string;
  }[];
}

const ArticleInfobox = ({ title, url, data }: InfoboxProps) => {
  // Extract potential data from URL or use defaults
  const getDefaultData = () => {
    const items = [
      { label: "Source", value: "Wikipedia" },
      { label: "Status", value: "Rewritten for neutrality" },
      { label: "Analysis", value: "Complete" },
    ];

    // Try to extract date from URL if it's a dated article
    if (url) {
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      items.push({ label: "Last analyzed", value: currentDate });
    }

    return items;
  };

  const displayData = data || getDefaultData();

  return (
    <div className="float-right ml-4 mb-4 w-full sm:w-80 bg-[#f8f9fa] border border-[#a2a9b1] rounded shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#eaecf0] to-[#f6f6f6] px-4 py-3 border-b border-[#a2a9b1]">
        <h3 className="text-center font-serif text-lg font-semibold text-[#202122]">
          {title}
        </h3>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Placeholder for image */}
        <div className="mb-4 bg-white border border-[#a2a9b1] rounded overflow-hidden">
          <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#eaecf0]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#a2a9b1]"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
        </div>

        {/* Data rows */}
        <table className="w-full text-sm">
          <tbody>
            {displayData.map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-white" : "bg-[#f8f9fa]"}
              >
                <th className="text-left py-2 px-3 font-semibold text-[#202122] border-t border-[#a2a9b1] align-top">
                  {item.label}
                </th>
                <td className="py-2 px-3 text-[#54595d] border-t border-[#a2a9b1]">
                  {item.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ArticleInfobox;

