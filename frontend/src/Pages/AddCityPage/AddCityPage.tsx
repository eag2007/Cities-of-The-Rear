import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./AddCityPage.css";
import { postCityApi } from "../../Services/CityService";
import AddCityPageHeader from "../../Components/AddCityPage/AddCityPageHeader/AddCityPageHeader";
import { useAuth } from "../../Context/useAuth";
import Editor from "../../Components/Editor/Editor";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Category {
  id: number;
  name: string;
  color: string;
}

const LocationMarker = ({
  position,
  setPosition,
}: {
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
}) => {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
};

const AddCityPage: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    55.751244, 37.618423,
  ]);

  const [city, setCity] = useState({
    names: [""],
    imageUrl: "",
    shortDesc: "",
    longDesc: "",
    contribution: "",
    categories: [] as number[],
    coordinates: [55.751244, 37.618423] as [number, number],
  });

  // Отдельное состояние для строки ввода названий (через запятую)
  const [namesInput, setNamesInput] = useState("");

  // Синхронизация namesInput с city.names при загрузке
  useEffect(() => {
    setNamesInput(city.names.join(", "));
  }, []);

  const categories: Category[] = [
    { id: 1, name: "Оружие", color: "#dc2626" },
    { id: 2, name: "Обмундирование", color: "#8b5cf6" },
    { id: 3, name: "Техника", color: "#f59e0b" },
    { id: 4, name: "Продовольствие", color: "#10b981" },
  ];

  const handleCategoryToggle = (categoryId: number) => {
    setCity((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const handleCoordinateChange = (type: "lat" | "lng", value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setCity((prev) => {
      const newCoordinates: [number, number] = [...prev.coordinates];
      if (type === "lat") {
        newCoordinates[0] = numValue;
      } else {
        newCoordinates[1] = numValue;
      }
      return { ...prev, coordinates: newCoordinates };
    });
  };

  const handleMapClick = (position: [number, number]) => {
    setCity((prev) => ({ ...prev, coordinates: position }));
    setMapCenter(position);
  };

  // Обработчик изменения поля ввода названий
  const handleNamesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setNamesInput(rawValue);

    // Разбиваем строку по запятым, обрезаем пробелы, убираем пустые
    const namesArray = rawValue
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name !== "");

    // Обновляем city.names (если массив пуст, оставляем [""] для валидации)
    setCity((prev) => ({
      ...prev,
      names: namesArray.length ? namesArray : [""],
    }));
  };

  const handleSave = async () => {
    // Валидация: проверяем, что есть хотя бы одно непустое название
    const validNames = city.names.filter((name) => name.trim() !== "");
    if (validNames.length === 0) {
      alert("Введите хотя бы одно название города");
      return;
    }
    if (!city.shortDesc.trim()) {
      alert("Введите краткое описание");
      return;
    }
    if (!city.contribution.trim()) {
      alert("Введите основной вклад");
      return;
    }
    if (
      !city.coordinates ||
      city.coordinates[0] === 0 ||
      city.coordinates[1] === 0
    ) {
      alert("Укажите координаты города на карте");
      return;
    }

    setSaving(true);

    try {
      await postCityApi(
        city.names, // передаём массив названий
        city.imageUrl,
        city.shortDesc,
        city.longDesc,
        city.contribution,
        city.categories,
        city.coordinates,
        user?.token || null,
      );
      alert("Город успешно добавлен!");
      navigate("/");
    } catch (error) {
      console.error("Ошибка при добавлении города:", error);
      alert("Произошла ошибка при добавлении города");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-city-page">
      <AddCityPageHeader saving={saving} handleSave={handleSave} />

      <div className="add-container">
        <div className="add-grid">
          <div className="add-form-column">
            <div className="form-section">
              <label className="form-label">
                Названия города
                <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={namesInput}
                onChange={handleNamesInputChange}
                placeholder="Введите названия через запятую (например, Челябинск, Нижний Тагил, Иваново)"
              />
              <p className="form-hint">
                Можно указать несколько названий (исторические, народные) через
                запятую
              </p>
              {city.names.length > 0 && city.names[0] !== "" && (
                <div className="names-preview">
                  <span className="preview-badge">Будет добавлено:</span>
                  {city.names.map((name, idx) => (
                    <span key={idx} className="name-tag">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-section">
              <label className="form-label">
                Координаты на карте
                <span className="required">*</span>
              </label>
              <div className="coordinates-inputs">
                <div className="coord-input">
                  <label>Широта</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={city.coordinates[0]}
                    onChange={(e) =>
                      handleCoordinateChange("lat", e.target.value)
                    }
                    placeholder="55.751244"
                  />
                </div>
                <div className="coord-input">
                  <label>Долгота</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={city.coordinates[1]}
                    onChange={(e) =>
                      handleCoordinateChange("lng", e.target.value)
                    }
                    placeholder="37.618423"
                  />
                </div>
              </div>
              <p className="form-hint">
                Введите координаты или кликните на карте справа
              </p>
            </div>

            <div className="form-section">
              <label className="form-label">URL изображения</label>
              <input
                type="text"
                className="form-input"
                value={city.imageUrl}
                onChange={(e) => setCity({ ...city, imageUrl: e.target.value })}
                placeholder="https://example.com/city-photo.jpg"
              />
              <p className="form-hint">
                Вставьте прямую ссылку на изображение города
              </p>
            </div>

            <div className="form-section">
              <label className="form-label">
                Краткое описание
                <span className="required">*</span>
              </label>
              <textarea
                className="form-textarea"
                rows={4}
                value={city.shortDesc}
                onChange={(e) =>
                  setCity({ ...city, shortDesc: e.target.value })
                }
                placeholder="Краткое описание города и его вклада в Победу..."
              />
              <p className="form-hint">
                Краткое описание будет отображаться в карточке города (до 200
                символов)
              </p>
            </div>

            <div className="form-section">
              <label className="form-label">
                Основной вклад в Победу
                <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={city.contribution}
                onChange={(e) =>
                  setCity({ ...city, contribution: e.target.value })
                }
                placeholder="Например: Танки, двигатели, боеприпасы"
              />
              <p className="form-hint">
                Основные направления производства или вклада города
              </p>
            </div>

            <div className="form-section">
              <label className="form-label">Категории</label>
              <div className="categories-grid">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-chip ${city.categories.includes(cat.id) ? "active" : ""}`}
                    style={{
                      borderColor: city.categories.includes(cat.id)
                        ? cat.color
                        : "#e0d6c5",
                      background: city.categories.includes(cat.id)
                        ? `${cat.color}10`
                        : "white",
                    }}
                    onClick={() => handleCategoryToggle(cat.id)}
                  >
                    <span>{cat.name}</span>
                    {city.categories.includes(cat.id) && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <p className="form-hint">
                Выберите категории, к которым относится город
              </p>
            </div>
          </div>

          <div className="add-preview-column">
            <div className="preview-section">
              <label className="form-label">Превью изображения</label>
              <div className="image-preview">
                {city.imageUrl ? (
                  <img
                    src={city.imageUrl}
                    alt={city.names[0] || "Город"}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        `
                      <div class="image-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <p>Ошибка загрузки изображения</p>
                      </div>
                    `;
                    }}
                  />
                ) : (
                  <div className="image-placeholder">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>Предпросмотр изображения</p>
                    <span>URL изображения появится здесь</span>
                  </div>
                )}
              </div>
            </div>

            <div className="preview-section">
              <label className="form-label">
                Выберите местоположение на карте
              </label>
              <div className="map-selector">
                <MapContainer
                  center={mapCenter}
                  zoom={10}
                  style={{
                    height: "300px",
                    width: "100%",
                    borderRadius: "8px",
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker
                    position={city.coordinates}
                    setPosition={handleMapClick}
                  />
                </MapContainer>
                <p className="form-hint">
                  Кликните на карту, чтобы установить местоположение города
                </p>
              </div>
            </div>

            {city.categories.length > 0 && (
              <div className="preview-section">
                <label className="form-label">Выбранные категории</label>
                <div className="selected-categories">
                  {city.categories.map((catId) => {
                    const cat = categories.find((c) => c.id === catId);
                    return cat ? (
                      <span
                        key={cat.id}
                        className="selected-category"
                        style={{
                          background: `${cat.color}15`,
                          borderColor: cat.color,
                        }}
                      >
                        <span>{cat.name}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="full-description-wrapper">
            <label className="form-label">Полное описание</label>
            <div className="quill-wrapper">
              <Editor
                value={city.longDesc}
                onChange={(value) => setCity({ ...city, longDesc: value })}
                placeholder="Введите подробное описание города с использованием форматирования..."
                className="city-quill-editor"
              />
            </div>
            <p className="form-hint">
              Используйте инструменты форматирования для создания
              структурированного описания
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCityPage;
