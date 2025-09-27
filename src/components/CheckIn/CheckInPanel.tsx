import { useState } from 'react';
import { QrCode, Users, CheckCircle, Clock, Scan } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function CheckInPanel() {
  const { state, dispatch } = useApp();
  const { events, users } = state;
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<string>('');

  const approvedEvents = events.filter(e => e.status === 'approved');
  const selectedEventData = events.find(e => e.id === selectedEvent);

  const handleQRScan = () => {
    if (!selectedEvent || !qrInput.trim()) {
      setScanResult('Vui lòng chọn sự kiện và nhập mã QR');
      return;
    }

    // Parse QR code format: eventId-userId-timestamp
    const qrParts = qrInput.trim().split('-');
    if (qrParts.length !== 3) {
      setScanResult('Mã QR không hợp lệ');
      return;
    }

    const [eventId, userId] = qrParts;
    
    if (eventId !== selectedEvent) {
      setScanResult('Mã QR không thuộc sự kiện đã chọn');
      return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) {
      setScanResult('Không tìm thấy sự kiện');
      return;
    }
    
    const participant = event.participants.find(p => p.userId === userId);
    
    if (!participant) {
      setScanResult('Người dùng chưa đăng ký sự kiện này');
      return;
    }

    if (participant.checkedIn) {
      setScanResult('Người dùng đã điểm danh trước đó');
      return;
    }

    // Check if event is happening now
    const now = new Date();
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    if (now < eventStart) {
      setScanResult('Sự kiện chưa bắt đầu, không thể điểm danh');
      return;
    }

    if (now > eventEnd) {
      setScanResult('Sự kiện đã kết thúc, không thể điểm danh');
      return;
    }

    // Perform check-in
    dispatch({
      type: 'CHECK_IN',
      payload: { eventId, userId }
    });

    const user = users.find(u => u.id === userId);
    setScanResult(`Điểm danh thành công cho ${user?.name}`);
    setQrInput('');
  };

  const getEventStatus = (event: any) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (now < start) return { status: 'upcoming', text: 'Sắp diễn ra', color: 'text-blue-600' };
    if (now >= start && now <= end) return { status: 'ongoing', text: 'Đang diễn ra', color: 'text-green-600' };
    return { status: 'ended', text: 'Đã kết thúc', color: 'text-gray-600 dark:text-dark-text-secondary' };
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">Điểm danh sự kiện</h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mt-1">Quét mã QR để điểm danh người tham gia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Scanner */}
        <div className="card rounded-xl shadow-sm  p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-6 flex items-center">
            <Scan className="h-5 w-5 mr-2" />
            Quét mã QR
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Chọn sự kiện
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full input-field px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn sự kiện...</option>
                {approvedEvents.map((event) => {
                  const status = getEventStatus(event);
                  return (
                    <option key={event.id} value={event.id}>
                      {event.title} - {status.text}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Mã QR hoặc nhập thủ công
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Quét hoặc nhập mã QR..."
                  className="flex-1 input-field px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleQRScan}
                  disabled={!selectedEvent || !qrInput.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Quét
                </button>
              </div>
            </div>

            {scanResult && (
              <div className={`p-4 rounded-lg ${
                scanResult.includes('thành công') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                {scanResult}
              </div>
            )}
          </div>
        </div>

        {/* Event Details */}
        {selectedEventData && (
          <div className="card rounded-xl shadow-sm  p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-6">
              Chi tiết sự kiện
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-dark-text-primary">{selectedEventData.title}</h4>
                <p className="text-gray-600 dark:text-dark-text-secondary text-sm mt-1">{selectedEventData.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-dark-text-tertiary">Thời gian:</span>
                  <p className="font-medium">
                    {new Date(selectedEventData.startTime).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-gray-600 dark:text-dark-text-secondary">
                    {new Date(selectedEventData.startTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {new Date(selectedEventData.endTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-text-tertiary">Địa điểm:</span>
                  <p className="font-medium">{selectedEventData.location}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center text-blue-600 mb-1">
                      <Users className="h-4 w-4 mr-1" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">
                      {selectedEventData.participants.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">Đăng ký</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center text-green-600 mb-1">
                      <CheckCircle className="h-4 w-4 mr-1" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">
                      {selectedEventData.participants.filter(p => p.checkedIn).length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">Đã điểm danh</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center text-orange-600 mb-1">
                      <Clock className="h-4 w-4 mr-1" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">
                      {selectedEventData.participants.filter(p => !p.checkedIn).length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">Chưa điểm danh</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Participants List */}
      {selectedEventData && (
        <div className="card rounded-xl shadow-sm ">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
              Danh sách người tham gia ({selectedEventData.participants.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {selectedEventData.participants.map((participant) => {
              const user = users.find(u => u.id === participant.userId);
              return (
                <div key={participant.userId} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                        {user?.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-dark-text-primary">{user?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 dark:text-dark-text-tertiary">
                      Đăng ký: {new Date(participant.joinedAt).toLocaleDateString('vi-VN')}
                    </span>
                    {participant.checkedIn ? (
                      <span className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Đã điểm danh
                      </span>
                    ) : (
                      <span className="flex items-center text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        Chưa điểm danh
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {selectedEventData.participants.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-dark-text-tertiary">
                Chưa có người đăng ký tham gia
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}