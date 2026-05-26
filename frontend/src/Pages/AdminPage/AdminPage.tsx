import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPage.css";
import "../../style.css";
import * as Yup from "yup";
import { useAuth } from "../../Context/useAuth";
import { UserProfile, UserProfileToken } from "../../Models/User";
import { getAllAdminsApi } from "../../Services/UserService";
import { deleteCityByIdApi, getAllCitiesApi } from "../../Services/CityService";
import { City } from "../../Models/City";
import {
  deleteAccountByIdApi,
  registerAdminAPI,
} from "../../Services/AuthService";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import {
  Cog,
  CookingPot,
  Crown,
  LandPlot,
  Pencil,
  Shield,
  Shirt,
  Trash2,
  Users,
} from "lucide-react";
import { BounceLoader } from "react-spinners";

type RegisterFormsInput = {
  email: string;
  userName: string;
  password: string;
};

const validation = Yup.object().shape({
  email: Yup.string().required("Email is required"),
  userName: Yup.string().required("Username is required"),
  password: Yup.string()
    .matches(/[A-Z]/, "There must be at least one capital letter")
    .matches(/[0-9]/, "There must be at least one digit.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Add special symbol")
    .required("Password is required"),
});

const AdminPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormsInput>({ resolver: yupResolver(validation) });

  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState<UserProfileToken | null>(
    null,
  );
  const { user } = useAuth();
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  const [addingAdmin, setAddingAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalCities: 0,
    totalAdmins: 0,
    categoriesCount: { weapon: 0, tech: 0, food: 0, uniform: 0 },
  });

  const getAdmins = async () => {
    await getAllAdminsApi()
      .then((res) => {
        if (res?.data) {
          setAdmins(res.data);
          setStats((stats) => ({ ...stats, totalAdmins: admins.length }));
        }
      })
      .catch((e) => {
        console.log("No admin found");
      });
  };

  const getCities = async () => {
    await getAllCitiesApi()
      .then((res) => {
        if (res?.data) {
          setCities(res.data);

          const categoriesCount = {
            weapon: res.data.filter((c: City) => c.categories.includes(1))
              .length,
            uniform: res.data.filter((c: City) => c.categories.includes(2))
              .length,
            tech: res.data.filter((c: City) => c.categories.includes(3)).length,
            food: res.data.filter((c: City) => c.categories.includes(4)).length,
          };
          setStats((prev) => ({
            ...prev,
            totalCities: res.data.length,
            categoriesCount,
          }));
        }
      })
      .catch((e) => {
        console.log("No city found");
      });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([getAdmins(), getCities()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    getAdmins();
  }, [addingAdmin]);

  const handleAddAdmin = async (form: RegisterFormsInput) => {
    if (!form.userName || !form.email || !form.password) {
      alert("Заполните все поля");
      return;
    }

    setAddingAdmin(true);

    await registerAdminAPI(form.userName, form.email, form.password);
    setAddingAdmin(false);
  };

  const handleDeleteAdmin = async (id: number) => {
    if (user === currentAdmin) {
      alert("Нельзя удалить самого себя");
      return;
    }
    if (
      window.confirm("Вы уверены, что хотите удалить этого администратора?")
    ) {
      await deleteAccountByIdApi(id);
      setAdmins(admins.filter((admin) => admin.id !== id));
      setStats((prev) => ({ ...prev, totalAdmins: prev.totalAdmins - 1 }));
      alert("Администратор удален");
    }
  };

  const handleDeleteCity = async (id: number) => {
    if (window.confirm("Вы уверены, что хотите удалить этот город?")) {
      await deleteCityByIdApi(id);
      setCities(cities.filter((city) => city.id !== id));
      setStats((prev) => ({ ...prev, totalCities: prev.totalCities - 1 }));
      alert("Город удален");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <BounceLoader />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="header-left">
            <h1>Панель управления</h1>
            <p className="dashboard-subtitle">
              Управление городами и администраторами
            </p>
          </div>
          <div className="admin-profile">
            <div className="admin-avatar">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="admin-info">
              <span className="admin-name">{user?.username}</span>
              <span className="admin-role-badge">
                {user?.role === "SUPERADMIN"
                  ? "Супер-администратор"
                  : "Администратор"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <LandPlot />
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{stats.totalCities}</span>
              <span className="admin-stat-label">Городов</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="#000000"
              >
                <path d="M7 5h16v4h-1v1h-6a1 1 0 0 0-1 1v1a2 2 0 0 1-2 2H9.62c-.38 0-.73.22-.9.56l-2.45 4.89c-.17.34-.51.55-.89.55H2s-3 0 1-6c0 0 3-4-1-4V5h1l.5-1h3zm7 7v-1a1 1 0 0 0-1-1h-1s-1 1 0 2a2 2 0 0 1-2-2a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">
                {stats.categoriesCount.weapon}
              </span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <Cog />
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">
                {stats.categoriesCount.tech}
              </span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <CookingPot />
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">
                {stats.categoriesCount.food}
              </span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <Shirt />
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">
                {stats.categoriesCount.uniform}
              </span>
            </div>
          </div>
        </div>

        <div className="actions-bar">
          <button
            className="action-btn primary"
            onClick={() => navigate("/add")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Добавить город
          </button>
          <button
            className="action-btn secondary"
            onClick={() => setShowAddAdminModal(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Добавить админа
          </button>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <span className="section-icon">
                {" "}
                <LandPlot />
              </span>
              Города трудовой доблести
            </h2>
            <span className="section-count">{cities.length} городов</span>
          </div>
          <div className="cities-table-wrapper">
            <table className="cities-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Вклад</th>
                  <th>Категории</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((city) => (
                  <tr key={city.id}>
                    <td className="city-name-cell">
                      <div className="city-name-wrapper">
                        {city.imageUrl && (
                          <img
                            src={city.imageUrl}
                            alt={city.names[0]}
                            className="city-mini-image"
                          />
                        )}
                        <span className="city-name-text">{city.names[0]}</span>
                      </div>
                    </td>
                    <td className="contribution-cell">{city.contribution}</td>
                    <td>
                      <div className="city-categories">
                        {city.categories.map((cat) => (
                          <span key={cat} className={`category-badge ${cat}`}>
                            {cat === 1 && "Оружие"}
                            {cat === 2 && "Обмундирование"}
                            {cat === 3 && "Техника"}
                            {cat === 4 && "Продовольствие"}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => navigate(`/city/${city.id}/edit`)}
                          title="Редактировать"
                        >
                          <Pencil />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteCity(city.id)}
                          title="Удалить"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <span className="section-icon">
                <Users />
              </span>
              Администраторы
            </h2>
            <span className="section-count">{admins.length} пользователей</span>
          </div>
          <div className="admins-table-wrapper">
            <table className="admins-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Логин</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Дата регистрации</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className={
                      admin.username === user?.username
                        ? "current-user-row"
                        : ""
                    }
                  >
                    <td>#{admin.id}</td>
                    <td>
                      <div className="admin-name-cell">
                        {admin.username}
                        {admin.username === user?.username && (
                          <span className="current-badge">Вы</span>
                        )}
                      </div>
                    </td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`role-badge ${admin.role}`}>
                        {admin.role === "SUPERADMIN" ? (
                          <>
                            <Crown size={12} /> Супер-админ
                          </>
                        ) : (
                          <>
                            {" "}
                            <Shield size={12} /> Админ
                          </>
                        )}
                      </span>
                    </td>
                    <td>{formatDate(admin.createdAt)}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        disabled={admin.username === user?.username}
                        title={
                          admin.username === user?.username
                            ? "Нельзя удалить себя"
                            : "Удалить"
                        }
                      >
                        <Trash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Модальное окно добавления админа */}
      {showAddAdminModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddAdminModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">👤</div>
              <h3>Добавление администратора</h3>
              <button
                className="modal-close"
                onClick={() => setShowAddAdminModal(false)}
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleSubmit(handleAddAdmin)}
              className="add-admin-form"
            >
              <div className="form-group">
                <label>
                  <span className="label-icon">👤</span>
                  Логин
                </label>
                <input
                  type="text"
                  placeholder="Введите логин"
                  {...register("userName")}
                />
              </div>
              <div className="form-group">
                <label>
                  <span className="label-icon">📧</span>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  {...register("email")}
                />
              </div>
              <div className="form-group">
                <label>
                  <span className="label-icon">🔒</span>
                  Пароль
                </label>
                <input
                  type="password"
                  placeholder="Введите пароль"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="error-message">{errors.password.message}</p>
                )}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddAdminModal(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={addingAdmin}
                >
                  {addingAdmin ? "Добавление..." : "Добавить администратора"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;