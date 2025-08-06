export default function Features() {
  const features = [
    "Real-time messaging",
    "Group chats", 
    "Simple & secure"
  ];

  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <p className="text-black text-base font-normal">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
