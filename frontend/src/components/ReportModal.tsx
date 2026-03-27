import { useState } from 'react';
import { Check } from 'lucide-react';
import axios from 'axios';
import Modal from './Modal';
import { useToast } from './Toast';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoId: string;
}

export default function ReportModal({ isOpen, onClose, videoId }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState('');
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const { showToast } = useToast();

    const submitReport = async () => {
        if (!selectedReason) return;
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login to report', 'error');
            return;
        }
        try {
            await axios.post(`http://127.0.0.1:5000/api/reports/${videoId}`, { reason: selectedReason }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportSubmitted(true);
            showToast('Report submitted. Thank you!', 'success');
            setTimeout(() => { onClose(); setReportSubmitted(false); setSelectedReason(''); }, 2000);
        } catch (err) {
            showToast('Failed to submit report', 'error');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { onClose(); setReportSubmitted(false); setSelectedReason(''); }} title="Report Video">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {reportSubmitted ? (
                    <div style={{ textAlign: 'center', padding: '24px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(52, 168, 83, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 16px auto' }}>
                            <Check size={32} color="#34a853" />
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Report Received</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>Our team will review this content shortly.</p>
                    </div>
                ) : (
                    <>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Why are you reporting this video?</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['Spam or misleading', 'Sexual content', 'Violent or repulsive content', 'Harassment or bullying', 'Harmful or dangerous acts', 'Copyright violation'].map(reason => (
                                <label key={reason} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                    padding: '12px 14px', borderRadius: '10px',
                                    background: selectedReason === reason ? 'var(--bg-hover)' : 'transparent',
                                    border: `1px solid ${selectedReason === reason ? 'var(--accent)' : 'var(--border)'}`,
                                    transition: 'all 0.2s'
                                }}>
                                    <input type="radio" name="report" value={reason} checked={selectedReason === reason} onChange={(e) => setSelectedReason(e.target.value)} style={{ accentColor: 'var(--accent)' }} />
                                    <span style={{ fontSize: '14px' }}>{reason}</span>
                                </label>
                            ))}
                        </div>
                        <button onClick={submitReport} disabled={!selectedReason} style={{
                            padding: '14px', background: selectedReason ? 'var(--accent)' : 'var(--bg-hover)',
                            color: selectedReason ? '#fff' : 'var(--text-secondary)', border: 'none',
                            borderRadius: '10px', cursor: selectedReason ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold', marginTop: '8px', transition: 'all 0.2s'
                        }}>Submit Report</button>
                    </>
                )}
            </div>
        </Modal>
    );
}
