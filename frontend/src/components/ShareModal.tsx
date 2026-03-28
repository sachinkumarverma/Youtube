import { Copy } from 'lucide-react';
import Modal from './Modal';
import { useToast } from './Toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoId: string;
    videoTitle: string;
}

export default function ShareModal({ isOpen, onClose, videoId }: ShareModalProps) {
    const { showToast } = useToast();
    const shareUrl = `${window.location.origin}/video/${videoId}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard!', 'success');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share Video">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Share this video with your friends:</p>
                <div style={{
                    display: 'flex', gap: '8px', background: 'var(--bg-secondary)',
                    padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)'
                }}>
                    <input readOnly value={shareUrl} style={{
                        flex: 1, background: 'transparent', border: 'none',
                        color: 'var(--accent)', outline: 'none', fontSize: '14px',
                        fontWeight: '500', minWidth: 0
                    }} />
                    <button onClick={copyToClipboard} style={{
                        background: 'var(--accent)', color: '#fff', border: 'none',
                        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <Copy size={16} /> Copy
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
                    {/* Placeholder social icons could go here */}
                </div>
            </div>
        </Modal>
    );
}
