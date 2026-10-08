CREATE DATABASE CosmetologyCenterDB;
GO

USE CosmetologyCenterDB;
GO

CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    LastName NVARCHAR(100) NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    Login NVARCHAR(50) NOT NULL UNIQUE,
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    PasswordHash NVARCHAR(255) NOT NULL,
    RoleID INT NOT NULL,
    Photo VARBINARY(MAX),
    IsActive BIT DEFAULT 1,

    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleID)
        REFERENCES Roles(RoleID)
);

CREATE TABLE Profiles (
    ProfileID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    BirthDate DATE,
    Gender NVARCHAR(10),
    Allergies NVARCHAR(MAX),
    ChronicDiseases NVARCHAR(MAX),
    Medications NVARCHAR(MAX),

    CONSTRAINT FK_Profiles_Users FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
);


CREATE TABLE MedicalRecords (
    RecID INT IDENTITY(1,1) PRIMARY KEY,
    ClientID INT NOT NULL,
    SpecialistID INT NOT NULL,
    Recommendations NVARCHAR(MAX),

    CONSTRAINT FK_MedRec_Client FOREIGN KEY (ClientID)
        REFERENCES Users(UserID),

    CONSTRAINT FK_MedRec_Specialist FOREIGN KEY (SpecialistID)
        REFERENCES Users(UserID)
);


CREATE TABLE PrescribeMedications (
    PrescID INT IDENTITY(1,1) PRIMARY KEY,
    MedicationName NVARCHAR(200) NOT NULL,
    IntakeFrequency NVARCHAR(100), -- например: 1 раз в день
    CourseDuration NVARCHAR(100),
    PrescribedDate DATETIME DEFAULT GETDATE(),
    Instructions NVARCHAR(MAX),
    IsActive BIT DEFAULT 1
);
ALTER TABLE PrescribeMedications ADD ClientID INT;
ALTER TABLE PrescribeMedications ADD SpecialistID INT;
ALTER TABLE PrescribeMedications ADD CONSTRAINT FK_Presc_Client 
  FOREIGN KEY (ClientID) REFERENCES Users(UserID);
ALTER TABLE PrescribeMedications ADD CONSTRAINT FK_Presc_Specialist 
  FOREIGN KEY (SpecialistID) REFERENCES MainSpecialists(SpecialistID);

ALTER TABLE PrescribeMedications
DROP COLUMN SpecialistID;

ALTER TABLE PrescribeMedications
DROP CONSTRAINT FK_Presc_Specialist;

CREATE TABLE MainSpecialists (
    SpecialistID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Experience INT, -- в годах
    Education NVARCHAR(255),
    SpecDescription NVARCHAR(MAX),

    CONSTRAINT FK_Specialists_User FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
);



CREATE TABLE WorkingHours (
    WorkHID INT IDENTITY(1,1) PRIMARY KEY,
    SpecialistID INT NOT NULL,
    DayOfWeek INT CHECK (DayOfWeek BETWEEN 0 AND 6), -- 0 = понедельник
    StartTime TIME,
    EndTime TIME,
    IsWorkingDay BIT DEFAULT 1,

    CONSTRAINT FK_WorkingHours_Specialist FOREIGN KEY (SpecialistID)
        REFERENCES MainSpecialists(SpecialistID)
);


CREATE TABLE BreakSlots (
    BreakID INT IDENTITY(1,1) PRIMARY KEY,
    SpecID INT NOT NULL,
    DayOfWeek INT,
    BreakStart TIME,
    BreakEnd TIME,

    CONSTRAINT FK_BreakSlots_Specialist FOREIGN KEY (SpecID)
        REFERENCES MainSpecialists(SpecialistID)
);



CREATE TABLE MainServices (
    ServiceID INT IDENTITY(1,1) PRIMARY KEY,
    ServiceName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Category NVARCHAR(100),
    Price DECIMAL(10,2),
    DurationMinutes INT,
    Indications NVARCHAR(MAX),
    Effect NVARCHAR(MAX),
    IsActive BIT DEFAULT 1
);
ALTER TABLE MainServices
ADD Photo VARBINARY(MAX);



CREATE TABLE ServiceCategories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE
);

ALTER TABLE ServiceCategories
ADD IsActive BIT DEFAULT 1;

INSERT INTO ServiceCategories (CategoryName)
VALUES
(N'Ногтевой сервис'),
(N'Педикюр'),
(N'Косметология'),
(N'Инъекции'),
(N'Эпиляция'),
(N'SPA'),
(N'Брови'),
(N'Ресницы'),
(N'Аппаратная косметология');

ALTER TABLE MainServices
ADD CategoryID INT;

ALTER TABLE MainServices
ADD CONSTRAINT FK_MainServices_Category
FOREIGN KEY (CategoryID)
REFERENCES ServiceCategories(CategoryID);

ALTER TABLE MainServices
DROP COLUMN Category;

CREATE TABLE Medications (
    MedID INT IDENTITY(1,1) PRIMARY KEY,
    MedName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Photo VARBINARY(MAX)
);


CREATE TABLE ProcedureMedications (
    ProcID INT NOT NULL,
    MedID INT NOT NULL,

    PRIMARY KEY (ProcID, MedID),

    CONSTRAINT FK_ProcMed_Service FOREIGN KEY (ProcID)
        REFERENCES MainServices(ServiceID),

    CONSTRAINT FK_ProcMed_Med FOREIGN KEY (MedID)
        REFERENCES Medications(MedID)
);

CREATE TABLE SpecialistService (
    SpecID INT NOT NULL,
    ServiceID INT NOT NULL,

    PRIMARY KEY (SpecID, ServiceID),

    CONSTRAINT FK_SpecServ_Spec FOREIGN KEY (SpecID)
        REFERENCES MainSpecialists(SpecialistID),

    CONSTRAINT FK_SpecServ_Service FOREIGN KEY (ServiceID)
        REFERENCES MainServices(ServiceID)
);

CREATE TABLE Reservations (
    ReservID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    SpecialistID INT NOT NULL,
    ServiceID INT NOT NULL,
    ReservDate DATE NOT NULL,
    ReservTime TIME NOT NULL,
    StatusID INT NOT NULL,

    CONSTRAINT FK_Reserv_User FOREIGN KEY (UserID)
        REFERENCES Users(UserID),

    CONSTRAINT FK_Reserv_Specialist FOREIGN KEY (SpecialistID)
        REFERENCES MainSpecialists(SpecialistID),

    CONSTRAINT FK_Reserv_Service FOREIGN KEY (ServiceID)
        REFERENCES MainServices(ServiceID),
          CONSTRAINT FK_Reserv_Status FOREIGN KEY (StatusID)
        REFERENCES ReservationStatuses(StatusID)
);



CREATE TABLE ReservationStatuses (
    StatusID INT IDENTITY(1,1) PRIMARY KEY,
    StatusName NVARCHAR(50) NOT NULL UNIQUE
);


CREATE TABLE Reviews (
    RevID INT IDENTITY(1,1) PRIMARY KEY,
    UserID int NOT NULL,
    Text NVARCHAR(max) NOT NULL,
    
    CONSTRAINT FK_Review_User FOREIGN KEY (UserID)
        REFERENCES Users(UserID),

);

INSERT INTO ReservationStatuses (StatusName)
VALUES 
    (N'Отменена'),
    (N'Подтверждена'),
    (N'Ожидает подтверждения');


    INSERT INTO Roles (RoleName)
VALUES 
    (N'Клиент'),
    (N'Администратор'),
    (N'Специалист');

EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;

EXEC sp_configure 'Ad Hoc Distributed Queries', 1;
RECONFIGURE;


INSERT INTO Users (LastName, FirstName, Login, Phone, Email, PasswordHash, RoleID, Photo, IsActive)

SELECT 
N'Иванова',N'Анна',N'user1',N'+111',N'u1@mail.com',N'123',1,img.BulkColumn,1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\ава2.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Петров',N'Иван',N'user2',N'+222',N'u2@mail.com',N'123',1,img.BulkColumn,1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\ава2.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Сидоров',N'Пётр',N'user3',N'+333',N'u3@mail.com',N'123',3,img.BulkColumn,1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог3.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Козлова',N'Мария',N'user4',N'+444',N'u4@mail.com',N'123',3,img.BulkColumn,1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог5.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Смирнов',N'Алексей',N'user5',N'+555',N'u5@mail.com',N'123',1,img.BulkColumn,1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\ава3.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Федоров',N'Дмитрий',N'user6',N'+666',N'u6@mail.com',N'123',1,img.BulkColumn,1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\ава3.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Морозова',N'Елена',N'user7',N'+777',N'u7@mail.com',N'123',3,img.BulkColumn,1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог6.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Волков',N'Сергей',N'user8',N'+888',N'u8@mail.com',N'123',2,img.BulkColumn,1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог5.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Лебедева',N'Ольга',N'user9',N'+999',N'u9@mail.com',N'123',1,img.BulkColumn,1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\ава3.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Орлов',N'Максим',N'user10',N'+1010',N'u10@mail.com',N'123',3,img.BulkColumn,1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог3.jpg', SINGLE_BLOB) AS img;


INSERT INTO Profiles (UserID, BirthDate, Gender, Allergies, ChronicDiseases, Medications)
VALUES
(7,'1995-01-01',N'Ж',N'Нет',N'Нет',N'Нет'),
(8,'1990-02-02',N'М',N'Пыльца',N'Нет',N'Нет'),
(9,'1988-03-03',N'М',N'Нет',N'Астма',N'Ингалятор'),
(10,'1992-04-04',N'Ж',N'Косметика',N'Нет',N'Нет'),
(11,'1997-05-05',N'М',N'Нет',N'Нет',N'Нет'),
(12,'1991-06-06',N'М',N'Нет',N'Нет',N'Нет'),
(13,'1985-07-07',N'Ж',N'Нет',N'Диабет',N'Инсулин'),
(14,'1993-08-08',N'М',N'Нет',N'Нет',N'Нет'),
(15,'1998-09-09',N'Ж',N'Нет',N'Нет',N'Нет'),
(16,'1996-10-10',N'М',N'Нет',N'Нет',N'Нет');


INSERT INTO MainSpecialists (UserID, Experience, Education, SpecDescription)
VALUES
(9,5,N'Медицинское',N'Косметолог'),
(10,4,N'Медицинское',N'Дерматолог'),
(13,6,N'Высшее',N'Инъекции'),
(16,8,N'Высшее',N'Эксперт')


INSERT INTO MainSpecialists (UserID, Experience, Education, SpecDescription)
VALUES
(16,5,N'Медицинское',N'Косметолог'),
(18,4,N'Медицинское',N'Дерматолог'),
(19,6,N'Высшее',N'Инъекции'),
(20,2,N'Высшее',N'Эксперт'),
(21,4,N'Высшее',N'Дерматолог'),
(22,6,N'Высшее',N'Косметик'),
(23,9,N'Высшее',N'Эстетист'),
(24,8,N'Высшее',N'Эксперт')


INSERT INTO SpecialistService VALUES (4,4),(5,5),(6,6),(7,7),(8,8),(9,9),(10,10),(11,11),(12,12),(13,13);


INSERT INTO WorkingHours (SpecialistID, DayOfWeek, StartTime, EndTime)
VALUES
(4,1,'09:00','18:00'),
(5,2,'10:00','19:00'),
(6,3,'09:00','17:00'),
(7,4,'11:00','20:00')


INSERT INTO BreakSlots (SpecID, DayOfWeek, BreakStart, BreakEnd)
VALUES
(4,1,'13:00','14:00'),
(5,2,'14:00','15:00'),
(6,3,'12:00','13:00'),
(7,4,'15:00','16:00')


INSERT INTO MainServices (ServiceName, Description, Category, Price, DurationMinutes, Indications, Effect, IsActive, Photo)
SELECT N'Чистка',N'Описание',N'Косметология',50,60,N'Акне',N'Очищение',1,BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\чистка лица.jpg', SINGLE_BLOB) AS img

UNION ALL
SELECT N'Пилинг',N'Описание',N'Косметология',70,45,N'Пигмент',N'Обновление',1,BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Пилинг.jpg', SINGLE_BLOB)AS img

UNION ALL
SELECT N'Массаж',N'Описание',N'Массаж',40,30,N'Стресс',N'Релакс',1,BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Массаж лица.jpg', SINGLE_BLOB)AS img

UNION ALL
SELECT N'Лазер',N'Описание',N'Эстетика',100,60,N'Волосы',N'Гладкость',1,BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Лазерная.jpg', SINGLE_BLOB)AS img

UNION ALL
SELECT N'Био',N'Описание',N'Инъекции',120,50,N'Сухость',N'Увлажнение',1,BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Мезотерапия.jpg', SINGLE_BLOB)AS img





INSERT INTO Medications (MedName, Description, Photo)
SELECT 
N'Крем для рук «Ureaderm» (10% мочевина)',
N'Увлажняющий и регенерирующий крем для рук и кутикулы. Содержит мочевину, аллантоин, пантенол. Используется после маникюра для заживления микротрещин, смягчения огрубевшей кожи и кутикулы. Не оставляет жирной плёнки.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Крем для рук.jpg', SINGLE_BLOB) AS img
UNION ALL

SELECT 
N'Средство для удаления кутикулы «CutiRemove» (ARAVIA)',
N'Химический ремувер на основе фруктовых кислот (AHA-кислоты, молочная кислота). Размягчает кутикулу за 2-3 минуты без распаривания. Безопасен для ногтевой пластины, используется в классическом и аппаратном маникюре.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\удаление кутикулы.jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Сыворотка для укрепления ногтей «Nail Hardener» (Smart Enamel)',
N'Лечебная сыворотка с кальцием, кератином и витамином E. Проникает в структуру ногтя, склеивает слои кератина. Показана при ломких, слоящихся ногтях. Наносится под базовое покрытие или отдельно.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\сыворотка для ногтей.jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Противогрибковый спрей «Lamisil Uno»',
N'Спрей на основе тербинафина. Используется при педикюре для профилактики и лечения грибка стопы и ногтей. Обрабатываются стопы, межпальцевые промежутки и внутренняя поверхность обуви. Действует 24 часа после одного нанесения.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\противогрибковый.jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Гель для удаления натоптышей «Gehwol Fusskraft»',
N'Кератолитический гель с салициловой кислотой (20%) и экстрактом чайного дерева. Размягчает огрубевшую кожу, мозоли и натоптыши для последующего безболезненного удаления. Применяется только под контролем мастера педикюра.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\натоптыши.jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Лосьон для подготовки к чистке лица «Prep Lotion» (Holy Land)',
N'Пре-пилинг лосьон с гликолевой и салициловой кислотой. Наносится за 10-15 минут до ультразвуковой или механической чистки для раскрытия пор, растворения себума и облегчения удаления комедонов. pH 3.5-4.0.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\лосьон.jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Маска противовоспалительная «Stop Akne» (Gigi)',
N'Глиняная маска с цинком, серой и экстрактом коры дуба. Наносится после чистки лица для снятия покраснения, подсушивания воспалений и сужения пор. Содержит азелаиновую кислоту (5%).',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Маска противовоспалительная «Stop Akne» (Gigi).jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Препарат для биоревитализации «Juvederm Hydrate» (Allergan)',
N'Стабилизированная гиалуроновая кислота неживотного происхождения (20 мг/мл). Вводится инъекционно в среднюю треть дермы. Обеспечивает пролонгированное увлажнение до 6 месяцев, стимулирует синтез коллагена I и III типа. Сертифицированный медицинский имплантат.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Биоревит.jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Анестетик «EMLA» крем (лидокаин + прилокаин)',
N'Поверхностная анестезия для инъекционных процедур (биоревитализация, мезотерапия). Наносится за 30-40 минут под окклюзионную повязку. Обезболивает кожу на глубину до 5 мм, делая уколы практически безболезненными. Детский и взрослый состав.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Анестетик «EMLA» крем (лидокаин + прилокаин).jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Гель после лазерной эпиляции «Laser Aid» (Derm AHA)',
N'Охлаждающий гель с алоэ вера, пантенолом и бисабололом. Снимает покраснение и жжение после лазерной эпиляции. Ускоряет регенерацию кожи, предотвращает фолликулит. Не содержит спирта и отдушек. Гипоаллергенен.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Гель после лазерной эпиляции «Laser Aid» (Derm AHA).jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Масло для SPA-массажа «Aromatherapy Blend» (Styx)',
N'Натуральное массажное масло на основе масла жожоба и сладкого миндаля с эфирными маслами лаванды, иланг-иланга и майорана. Не впитывается мгновенно, обеспечивает скольжение 30-40 минут. Успокаивает нервную систему, снимает мышечные спазмы.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Масло для SPA-массажа «Aromatherapy Blend» (Styx).jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Хна для бровей «Brow Henna» (Brow Xenna)',
N'Натуральная хна с добавлением басмы и индиго. Не содержит аммиака и перекиси. Окрашивает кожу под волосками, создавая эффект растушевки (татуаж до 7 дней на коже и до 3 недель на волосках). Выпускается в 10 оттенках.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Хна для бровей «Brow Henna» (Brow Xenna).jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Кератиновый состав для ламинирования ресниц «Lash Lamination Kit» (LVL)',
N'Двухфазный состав: фаза 1 — тиогликолевая кислота для завивки (2-3 мин), фаза 2 — кератин и пантенол для фиксации и питания. Без аммиака. Придает изгиб до 90 градусов, утолщает каждый волосок.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Кератиновый состав.jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Раствор для пилинга Джесснера (Jessner’s Peel)',
N'Химический пилинг-раствор: резорцин 14%, салициловая кислота 14%, молочная кислота 14% в этаноле. Оказывает кератолитическое, антисептическое и отбеливающее действие. Наносится в 1-3 слоя. Применяется только врачом-косметологом.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Раствор для пилинга Джесснера (Jessner’s Peel).jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Контактный гель для RF-лифтинга «RF Coupling Gel» (BTL)',
N'Водный гель на основе глицерина и карбомера. Обеспечивает проводимость радиочастотного тока (0,46-0,8 МГц) и защиту кожи от перегрева. Бионейтрален, не содержит ионов металлов. Смывается теплой водой.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Контактный гель для RF-лифтинга «RF Coupling Gel» (BTL).jpg', SINGLE_BLOB)AS img
UNION ALL

SELECT 
N'Диффузорная композиция с эфирными маслами «Deep Relax» (Now Foods)',
N'Смесь 100% натуральных эфирных масел: лаванда (40%), ромашка римская (20%), майоран (15%), иланг-иланг (15%), сандал (10%). Используется в аромадиффузоре при процедуре ароматерапии. Не содержит синтетических отдушек.',
BulkColumn FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Диффузорная композиция с эфирными маслами «Deep Relax» (Now Foods).jpg', SINGLE_BLOB)AS img;





INSERT INTO MainServices
(ServiceName, Description, Category, Price, DurationMinutes, Indications, Effect, IsActive, Photo)
SELECT
N'Классический маникюр',
N'Традиционный обрезной маникюр с размягчением кутикулы в ванночке. Включает придание формы ногтям, удаление кутикулы и огрубевшей кожи, выравнивание ногтевой пластины, финишное покрытие маслом и кремом для рук. Подходит для плотной и сухой кутикулы.',
N'Ногтевой сервис',
1200.00,
60,
N'Ломкие ногти, заусенцы, сухая кутикула',
N'Идеально обработанные ногти с увлажненной кутикулой, аккуратный вид рук до 2 недель',
1,
BulkColumn
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Наращивание ногтей гелем.jpg', SINGLE_BLOB)AS img

UNION ALL

SELECT
N'Аппаратный педикюр',
N'Безопасная обработка стоп с помощью специальных фрез. Мягко удаляет огрубевшую кожу, натоптыши и мозоли без распаривания. Включает шлифовку пяток, обработку ногтей, полировку и покрытие. Абсолютно безболезненно, риск порезов и заусенцев исключен.',
N'Педикюр',
2000.00,
90,
N'Сухая кожа стоп, натоптыши, трещины, врастающие ногти, диабетическая стопа (по показаниям)',
N'Гладкие, мягкие стопы без мозолей, здоровый цвет ногтей, комфорт при ходьбе до 3-4 недель',
1,
BulkColumn
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Лечебный педикюр.jpg', SINGLE_BLOB)AS img

UNION ALL

SELECT
N'Ультразвуковая чистка лица',
N'Комбинированная глубокая очистка кожи: механическое удаление комедонов (ручная чистка) + ультразвуковая чистка для выравнивания микрорельефа. Этапы: распаривание, удаление загрязнений, противовоспалительная маска, сужение пор, увлажнение. Безболезненно, покраснение проходит за несколько часов.',
N'Косметология',
3500.00,
75,
N'Акне (комедоны, черные точки), расширенные поры, жирная/комбинированная кожа, тусклый цвет лица',
N'Чистая кожа без черных точек, суженные поры, ровный тон, матовость без жирного блеска',
1,
BulkColumn
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Ультразвуковая чистка лица.jpg', SINGLE_BLOB)AS img

UNION ALL

SELECT
N'Биоревитализация',
N'Инъекционная процедура с препаратами гиалуроновой кислоты. Глубокое увлажнение изнутри, стимуляция выработки собственного коллагена и эластина. Курс из 2-3 процедур. Быстро возвращает упругость, разглаживает мелкие морщины, устраняет шелушения и дряблость.',
N'Инъекции',
8500.00,
45,
N'Сухость кожи, обезвоженность, морщины, купероз, подготовка к зиме/лету, возрастные изменения 30+',
N'Интенсивное увлажнение и сияние, лифтинг-эффект, исчезновение шелушений, плотная и упругая кожа до 6 месяцев',
1,
BulkColumn
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\био.jpg', SINGLE_BLOB)AS img

UNION ALL

SELECT
N'Лазерная эпиляция',
N'Удаление волос диодным лазером с длиной волны 810 нм. Лазер воздействует на фолликул, не повреждая кожу. Процедура занимает 15-30 минут. Эффект накапливается с каждым сеансом. Подходит для всех типов кожи, кроме очень темной. Необходимо предварительное бритье за сутки.',
N'Эпиляция',
4000.00,
30,
N'Нежелательные волосы, темные жесткие волосы, вросшие волосы, раздражение после бритья',
N'Гладкость кожи без щетины, полное прекращение роста волос после курса (6-8 процедур), отсутствие вросших волос',
1,
BulkColumn
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Лазерная.jpg', SINGLE_BLOB)AS img

UNION ALL

SELECT
N'SPA-массаж тела',
N'Расслабляющий массаж с использованием теплых масел и ароматических композиций. Техника сочетает поглаживания, разминания и лимфодренажные движения. Снимает мышечные зажимы, улучшает кровообращение. Длительность 60 минут. Возможно добавление скрабирования или обертывания (опционально).',
N'SPA',
3000.00,
60,
N'Стресс, хроническая усталость, мышечное напряжение, бессонница, малоподвижный образ жизни',
N'Полная релаксация, снятие стресса, легкость в теле, улучшение настроения и качества сна, гладкая и увлажненная кожа',
1,
BulkColumn
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\SPA-массаж тела.jpg', SINGLE_BLOB)AS img

UNION ALL

SELECT
N'Коррекция бровей',
N'Формирование идеальной формы бровей с учетом анатомии лица. Этапы: очистка, моделирование формы (воск/пинцет), расчесывание, окрашивание хной или краской (включено), фиксация гелем. Результат – естественные или графичные брови на выбор. Длительность 30 минут.',
N'Брови',
800.00,
30,
N'Неаккуратные брови, редкие волоски, асимметрия, неподходящая форма, седые волоски, желание изменить имидж',
N'Четкая, симметричная форма, цвет на 2-3 недели, визуальная подтяжка лица, ухоженный взгляд без макияжа',
1,
BulkColumn
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Коррекция бровей.jpg', SINGLE_BLOB)AS img

UNION ALL

SELECT
N'Ламинирование ресниц',
N'Многоэтапный уход: питательная сыворотка, кератин, фиксатор. Ресницы становятся темнее, гуще, получают стойкий изгиб. Эффект «накрашенных ресниц» без туши. Процедура безвредна, можно носить линзы. Держится 4-6 недель. Завивка происходит на бигуди, длина визуально увеличивается.',
N'Ресницы',
2500.00,
90,
N'Слабые, тонкие, прямые или ломкие ресницы, отсутствие объема, аллергия на тушь, желание отказаться от ежедневного макияжа',
N'Выраженный объем, стойкий изгиб, темный цвет, эффект распахнутого взгляда, уход и укрепление ресниц',
1,
BulkColumn
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Ламинирование ресниц.jpg', SINGLE_BLOB)AS img

UNION ALL

SELECT
N'Пилинг Джесснера',
N'Химический пилинг средней глубины на основе резорцина, салициловой и молочной кислот. Отшелушивает омертвевшие клетки, запускает регенерацию. Требует подготовки (предпилинг) и последующего ухода. Видимое шелушение 3-5 дней. Процедура проводится курсом 3-4 раза с интервалом 2-3 недели.',
N'Косметология',
4200.00,
50,
N'Пигментация (веснушки, постакне), мелкие морщины, жирная/проблемная кожа, расширенные поры, постакне, тусклый цвет лица',
N'Обновление кожи, выравнивание тона и рельефа, сужение пор, осветление пигментации, лифтинг-эффект',
1,
BulkColumn
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Пилинг Джесснера.jpg', SINGLE_BLOB)AS img

UNION ALL

SELECT
N'RF-лифтинг лица',
N'Аппаратная безоперационная подтяжка. Радиочастотные волны прогревают глубокие слои кожи до 42-45°C, вызывая сокращение коллагеновых волокон. Безболезненно, без реабилитации. Результат заметен после 1 процедуры, максимальный эффект – через 1-2 месяца после курса 4-6 процедур.',
N'Аппаратная косметология',
5000.00,
60,
N'Птоз кожи (опущение), второй подбородок, носогубные складки, дряблость, потеря четкости овала лица, возраст 35+',
N'Заметная подтяжка контура лица, уменьшение брылей и второго подбородка, уплотнение кожи, разглаживание морщин',
1,
BulkColumn
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\RF-лифтинг лица.jpg', SINGLE_BLOB)AS img

UNION ALL

SELECT
N'Ароматерапия',
N'Релакс-процедура с использованием 100% натуральных эфирных масел. Вы выбираете аромат: лаванда (успокоение), цитрус (энергия), мята (ясность). Включает аромадиффузор, легкий массаж стоп/кистей, дыхательные практики. Идеальное завершение SPA-дня или подготовка к массажу.',
N'SPA',
1800.00,
50,
N'Стресс, тревожность, бессонница, мигрень, снижение иммунитета, переутомление, эмоциональное выгорание',
N'Глубокое расслабление, восстановление нервной системы, улучшение настроения, снятие тревоги, здоровый сон',
1,
BulkColumn
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\Ароматерапия.jpg', SINGLE_BLOB)AS img ;







INSERT INTO ProcedureMedications VALUES (9,5),(9,6),(10,7),(10,8),(11,9),(11,10),(12,11),(12,12),(13,13),(14,14),(15,15),(16,16),(17,17);



INSERT INTO Users (LastName, FirstName, Login, Phone, Email, PasswordHash, RoleID, Photo, IsActive)



SELECT 
N'Сидорова', N'Екатерина', N'master_ekaterina_s_01', N'+375297654321', N'ekaterina.sidorova@center.com', N'123', 3, img.BulkColumn, 1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог3.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Козлова', N'Мария', N'master_maria_k_02', N'+375298765432', N'maria.kozlova@center.com', N'123', 3, img.BulkColumn, 1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог5.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Морозова', N'Елена', N'master_elena_m_03', N'+375299876543', N'elena.morozova@center.com', N'123', 3, img.BulkColumn, 1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог6.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Орлова', N'Анастасия', N'master_anastasia_o_04', N'+375291112233', N'anastasia.orlova@center.com', N'123', 3, img.BulkColumn, 1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог3.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Виноградова', N'Татьяна', N'master_tatiana_v_05', N'+375292223344', N'tatiana.vinogradova@center.com', N'123', 3, img.BulkColumn, 1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог5.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Новикова', N'Ирина', N'master_irina_n_06', N'+375293334455', N'irina.novikova@center.com', N'123', 3, img.BulkColumn, 1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог6.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Михайлова', N'Светлана', N'master_svetlana_m_07', N'+375294445566', N'svetlana.mikhailova@center.com', N'123', 3, img.BulkColumn, 1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог3.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Федотова', N'Юлия', N'master_yulia_f_08', N'+375295556677', N'yulia.fedotova@center.com', N'123', 3, img.BulkColumn, 1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог5.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Григорьева', N'Анна', N'master_anna_g_09', N'+375296667788', N'anna.grigorieva@center.com', N'123', 3, img.BulkColumn, 1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог6.jpg', SINGLE_BLOB) AS img

UNION ALL

SELECT 
N'Дмитриева', N'Оксана', N'master_oksana_d_10', N'+375297778899', N'oksana.dmitrieva@center.com', N'123', 3, img.BulkColumn, 1
FROM OPENROWSET(BULK 'C:\pr\Course_Project\cosmetic-center-app\public\images\косметолог3.jpg', SINGLE_BLOB) AS img



-- 1. Создаём логин на уровне сервера
CREATE LOGIN skincode_user WITH PASSWORD = 'SkinCode2025!';

-- 2. Создаём пользователя в базе данных
USE CosmetologyCenterDB;
CREATE USER skincode_user FOR LOGIN skincode_user;

-- 3. Даём права на все операции
ALTER ROLE db_datareader ADD MEMBER skincode_user;
ALTER ROLE db_datawriter ADD MEMBER skincode_user;
GRANT EXECUTE TO skincode_user;


