'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SongsData } from '@/types';
import { loadSongsData } from '@/utils/quiz';
import { AlbumSelector } from '@/components/AlbumSelector';

export default function HomePage() {
  const router = useRouter();
  const [songsData, setSongsData] = useState<SongsData | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadSongsData();
        setSongsData(data);
        // デフォルトで最初のアーティストを選択
        if (data.artists.length > 0) {
          const firstArtist = data.artists[0];
          setSelectedArtistId(firstArtist.id);
          // 最初のアーティストの全アルバムを選択
          setSelectedAlbumIds(firstArtist.albums.map((album) => album.id));
        }
      } catch (error) {
        console.error('Failed to load songs data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleArtistChange = (artistId: string) => {
    setSelectedArtistId(artistId);
    setSelectedAlbumIds([]); // アーティスト変更時はアルバム選択をリセット
  };

  const handleAlbumToggle = (albumId: string) => {
    setSelectedAlbumIds((prev) => (prev.includes(albumId) ? prev.filter((id) => id !== albumId) : [...prev, albumId]));
  };

  const handleSelectAll = () => {
    const selectedArtist = songsData?.artists.find((artist) => artist.id === selectedArtistId);
    if (selectedArtist) {
      setSelectedAlbumIds(selectedArtist.albums.map((album) => album.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedAlbumIds([]);
  };

  const handleStartQuiz = () => {
    if (selectedAlbumIds.length === 0) {
      alert('アルバムを1つ以上選択してください。');
      return;
    }

    // 全アルバム数を取得
    const totalAlbums = songsData?.artists.reduce((count, artist) => count + artist.albums.length, 0) || 0;

    // すべてのアルバムが選択されている場合は、クエリパラメータなしでクイズ画面に遷移
    if (selectedAlbumIds.length === totalAlbums) {
      router.push('/quiz');
    } else {
      // 選択されたアルバムIDをクエリパラメータとして渡す
      const albumParams = selectedAlbumIds.join(',');
      router.push(`/quiz?albums=${encodeURIComponent(albumParams)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">データを読み込み中...</div>
      </div>
    );
  }

  if (!songsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">データの読み込みに失敗しました</div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* タイトル */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">中トロドン</h1>
          <p className="text-2xl text-gray-600 mb-4">曲の中トロを聴いて曲名を当てよう</p>
        </div>

        {/* 出題範囲設定エリア */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">出題範囲を選択</h2>
          <AlbumSelector
            artists={songsData.artists}
            selectedArtistId={selectedArtistId}
            selectedAlbumIds={selectedAlbumIds}
            onArtistChange={handleArtistChange}
            onAlbumToggle={handleAlbumToggle}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        </div>

        {/* クイズ開始ボタン */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleStartQuiz}
            disabled={selectedAlbumIds.length === 0}
            className={`px-16 py-6 text-2xl font-bold rounded-lg transform transition hover:scale-105 shadow-lg ${
              selectedAlbumIds.length === 0
                ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            クイズ開始
          </button>
          {selectedAlbumIds.length > 0 && (
            <p className="text-sm text-gray-600 mt-4">{selectedAlbumIds.length}個のアルバムが選択されています</p>
          )}
        </div>
      </div>
    </div>
  );
}
