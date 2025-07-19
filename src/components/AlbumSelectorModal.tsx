'use client';

import { useEffect, useState } from 'react';
import type { Artist } from '@/types';
import { AlbumSelector } from './AlbumSelector';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="モーダルを閉じる"
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>閉じる</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">{children}</div>
      </div>
    </div>
  );
}

interface AlbumSelectorModalProps {
  isOpen: boolean;
  onClose: (settings: { selectedArtistId: string; selectedAlbumIds: string[]; defaultPlayDuration: number | null }) => void;
  artists: Artist[];
  initialSelectedArtistId?: string;
  initialSelectedAlbumIds?: string[];
  initialDefaultPlayDuration?: number | null;
}

export function AlbumSelectorModal({
  isOpen,
  onClose,
  artists,
  initialSelectedArtistId = '',
  initialSelectedAlbumIds = [],
  initialDefaultPlayDuration = null,
}: AlbumSelectorModalProps) {
  const [selectedArtistId, setSelectedArtistId] = useState(initialSelectedArtistId);
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>(initialSelectedAlbumIds);
  const [defaultPlayDuration, setDefaultPlayDuration] = useState<number | null>(initialDefaultPlayDuration);

  // モーダルが開かれるたびに初期値をリセット
  useEffect(() => {
    if (isOpen) {
      setSelectedArtistId(initialSelectedArtistId);
      setSelectedAlbumIds(initialSelectedAlbumIds);
      setDefaultPlayDuration(initialDefaultPlayDuration);
    }
  }, [isOpen, initialSelectedArtistId, initialSelectedAlbumIds, initialDefaultPlayDuration]);

  // 内部ハンドラー
  const handleArtistChange = (artistId: string) => {
    setSelectedArtistId(artistId);
    setSelectedAlbumIds([]); // アーティスト変更時はアルバム選択をリセット
  };

  const handleAlbumToggle = (albumId: string) => {
    setSelectedAlbumIds((prev) => (prev.includes(albumId) ? prev.filter((id) => id !== albumId) : [...prev, albumId]));
  };

  const handleSelectAll = () => {
    const selectedArtist = artists.find((artist) => artist.id === selectedArtistId);
    if (selectedArtist) {
      setSelectedAlbumIds(selectedArtist.albums.map((album) => album.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedAlbumIds([]);
  };

  const handleClose = () => {
    // 設定を親に返してモーダルを閉じる
    onClose({
      selectedArtistId,
      selectedAlbumIds,
      defaultPlayDuration,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="出題範囲設定">
      <AlbumSelector
        artists={artists}
        selectedArtistId={selectedArtistId}
        selectedAlbumIds={selectedAlbumIds}
        onArtistChange={handleArtistChange}
        onAlbumToggle={handleAlbumToggle}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />

      {/* 再生時間デフォルト設定 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">再生時間設定</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="default-duration-select" className="block text-sm font-medium text-gray-700 mb-2">
              デフォルト再生時間
            </label>
            <select
              id="default-duration-select"
              value={defaultPlayDuration || ''}
              onChange={(e) => setDefaultPlayDuration(e.target.value ? Number(e.target.value) : null)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">未選択（現在の再生時間を引き継ぎ）</option>
              <option value={1}>1秒</option>
              <option value={1.5}>1.5秒</option>
              <option value={2}>2秒</option>
              <option value={3}>3秒</option>
              <option value={5}>5秒</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">未選択の場合、次の問題でも現在の再生時間がそのまま使用されます。</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={handleClose} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md">
          設定を閉じる
        </button>
      </div>
    </Modal>
  );
}
