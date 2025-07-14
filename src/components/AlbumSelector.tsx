'use client';

import type { Artist, Album } from '@/types';
import Image from 'next/image';

interface AlbumSelectorProps {
  artists: Artist[];
  selectedArtistId: string;
  selectedAlbumIds: string[];
  onArtistChange: (artistId: string) => void;
  onAlbumToggle: (albumId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function AlbumSelector({
  artists,
  selectedArtistId,
  selectedAlbumIds,
  onArtistChange,
  onAlbumToggle,
  onSelectAll,
  onDeselectAll,
}: AlbumSelectorProps) {
  const selectedArtist = artists.find((artist) => artist.id === selectedArtistId);
  const albums = selectedArtist?.albums || [];

  return (
    <div className="space-y-6">
      {/* アーティスト選択 */}
      <div>
        <label htmlFor="artist-select" className="block text-sm font-medium text-gray-700 mb-2">
          アーティストを選択
        </label>
        <select
          id="artist-select"
          value={selectedArtistId}
          onChange={(e) => onArtistChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">アーティストを選択してください</option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </select>
      </div>

      {/* アルバム選択 */}
      {selectedArtist && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">アルバムを選択 ({selectedArtist.name})</h3>
            <div className="space-x-2">
              <button type="button" onClick={onSelectAll} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded">
                すべて選択
              </button>
              <button
                type="button"
                onClick={onDeselectAll}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                すべて解除
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map((album: Album) => (
              <div
                key={album.id}
                className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                  selectedAlbumIds.includes(album.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onAlbumToggle(album.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onAlbumToggle(album.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="aspect-square mb-2 relative">
                  <Image src={album.jacketUrl} alt={album.name} fill className="object-cover rounded" />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedAlbumIds.includes(album.id)}
                    onChange={() => onAlbumToggle(album.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-900 line-clamp-2">{album.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{album.tracks.length}曲</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
