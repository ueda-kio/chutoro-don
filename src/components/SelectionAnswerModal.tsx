'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { SongsData, Album, Track } from '@/types';

interface SelectionAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedTrack: Track) => void;
  songsData: SongsData | null;
}

export function SelectionAnswerModal({ isOpen, onClose, onSubmit, songsData }: SelectionAnswerModalProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const handleAlbumSelect = (album: Album) => {
    setSelectedAlbum(album);
    setSelectedTrack(null);
  };

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
  };

  const handleSubmit = () => {
    if (selectedTrack) {
      onSubmit(selectedTrack);
      onClose();
      setSelectedAlbum(null);
      setSelectedTrack(null);
    }
  };

  const handleClose = useCallback(() => {
    onClose();
    setSelectedAlbum(null);
    setSelectedTrack(null);
  }, [onClose]);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* バックドロップ - クリックでモーダルを閉じる */}
      <div
        className="absolute inset-0"
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClose();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="モーダルを閉じる"
      />

      {/* モーダルコンテンツ */}
      <div className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-red-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">楽曲を選択</h2>
          <button type="button" onClick={handleClose} className="text-white hover:text-red-200 text-2xl">
            ×
          </button>
        </div>

        <div className="flex max-h-[70vh]">
          {/* アルバム一覧 */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-800">アルバム一覧</h3>
            </div>
            <div className="p-4">
              {songsData?.artists.map((artist) => (
                <div key={artist.id} className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">{artist.name}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {artist.albums.map((album) => (
                      <button
                        key={album.id}
                        type="button"
                        onClick={() => handleAlbumSelect(album)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          selectedAlbum?.id === album.id
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 relative flex-shrink-0">
                            <Image
                              src={album.jacketUrl}
                              alt={album.name}
                              fill
                              className="rounded object-cover"
                              sizes="48px"
                              style={{ objectFit: 'cover' }}
                              unoptimized
                            />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{album.name}</div>
                            <div className="text-xs text-gray-500">{album.tracks.length}曲</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 楽曲一覧 */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-800">{selectedAlbum ? `${selectedAlbum.name} の楽曲` : '楽曲一覧'}</h3>
            </div>
            <div className="p-4">
              {selectedAlbum ? (
                <div className="space-y-2">
                  {selectedAlbum.tracks.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleTrackSelect(track)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedTrack?.id === track.id
                          ? 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm">{track.title}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>左側からアルバムを選択してください</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button type="button" onClick={handleClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedTrack}
            className={`px-6 py-2 rounded-md font-medium ${
              selectedTrack ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            この楽曲で回答
          </button>
        </div>
      </div>
    </div>
  );
}
