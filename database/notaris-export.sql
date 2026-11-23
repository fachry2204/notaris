-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: notaris
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activitylog`
--

DROP TABLE IF EXISTS `activitylog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activitylog` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `activity` varchar(191) NOT NULL,
  `details` text DEFAULT NULL,
  `ipAddress` varchar(191) DEFAULT NULL,
  `device` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `ActivityLog_userId_fkey` (`userId`),
  CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activitylog`
--

LOCK TABLES `activitylog` WRITE;
/*!40000 ALTER TABLE `activitylog` DISABLE KEYS */;
INSERT INTO `activitylog` VALUES ('cmp5vpkb90002vh7obnoszq0g',NULL,'CREATE_CLIENT','Created client: Fachry Hidayat (cmp5vpkb40000vh7obs9ox4nq)',NULL,NULL,'2026-05-14 19:26:00.213'),('cmp5vq70m0005vh7o8x35ip0c',NULL,'CREATE_CLIENT','Created client: CV. Karya Mandiri (cmp5vq70i0003vh7oezpxt74t)',NULL,NULL,'2026-05-14 19:26:29.639'),('cmp5vwddj0007vh7oxxvlfwei',NULL,'UPDATE_CLIENT','Updated client: CV. Karya Mandiri (cmp5vq70i0003vh7oezpxt74t)',NULL,NULL,'2026-05-14 19:31:17.816'),('cmp5w1eps0009vh7oo5d6sk5g',NULL,'UPDATE_CLIENT','Updated client: CV. Karya Mandiri (cmp5vq70i0003vh7oezpxt74t)',NULL,NULL,'2026-05-14 19:35:12.833'),('cmp5wfmv30004vhxcswhnzp0n',NULL,'CREATE_STAFF','Created staff & user: FERI (cmp5wfmuo0000vhxcd4etw0tv)',NULL,NULL,'2026-05-14 19:46:16.576'),('cmp5wih4x0003vhm46nujxitk',NULL,'UPDATE_STAFF','Updated staff: FERI (cmp5wfmuo0000vhxcd4etw0tv)',NULL,NULL,'2026-05-14 19:48:29.122'),('cmp5wm3s00007vhm4nbc8qr15',NULL,'UPDATE_STAFF','Updated staff: FERI (cmp5wfmuo0000vhxcd4etw0tv)',NULL,NULL,'2026-05-14 19:51:18.433'),('cmp5wp7do0009vhm45eltq3mc',NULL,'DELETE_STAFF','Deleted staff & user: FERI (cmp5wfmuo0000vhxcd4etw0tv)',NULL,NULL,'2026-05-14 19:53:43.069'),('cmp5wpst9000evhm4yyf3lz3l',NULL,'CREATE_STAFF','Created staff & user: Fachry (cmp5wpssz000avhm4h0nh6ybw)',NULL,NULL,'2026-05-14 19:54:10.845'),('cmp5xbu6e000jvhm4tzbnl21w',NULL,'CREATE_STAFF','Created staff & user: Jaka (cmp5xbu5r000fvhm4i1pbildk)',NULL,NULL,'2026-05-14 20:11:19.047'),('cmp5xebq0000lvhm4jbfnxqv9',NULL,'UPDATE_STATUS','Updated status for staff: Jaka to Inactive',NULL,NULL,'2026-05-14 20:13:15.096'),('cmp5xov1x000nvhm4wchpp5ps',NULL,'UPDATE_STATUS','Updated status for staff: Jaka to Active',NULL,NULL,'2026-05-14 20:21:26.709'),('cmp5yzvy8000wvhm4vjqwcy83',NULL,'CREATE_JOB','Created job: PT / PMA - Pendirian (BHM-2026-0001)',NULL,NULL,'2026-05-14 20:58:00.705'),('log-07jo3o5b0','cmp5wpssz000avhm4h0nh6ybw','CHECK_OUT','Fachry melakukan absensi di Jalan Saman II, Gaga, Larangan, Tangerang, Banten, Java, 15155, Indonesia',NULL,NULL,'2026-06-16 04:29:24.328'),('log-0rglbzehe','cmp5wpssz000avhm4h0nh6ybw','CHECK_IN','Fachry melakukan absensi di Citra Sentul Raya, Kadumanggu, Babakan Madang, Bogor, West Java, 16810, Indonesia',NULL,NULL,'2026-06-10 12:45:50.310'),('LOG-11fPmddWXwy8','cmp5y35wt0000vh1015ynbnq9','UPDATE_JOB_PROGRESS','Memperbarui progress berkas job-1en1a9v7m','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-23 22:42:26.000'),('LOG-3hV19DesP75v','cmp5y35wt0000vh1015ynbnq9','UPDATE_JOB','Memperbarui berkas job-hicvueaudize','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-09-02 21:04:17.000'),('log-3pb1ddqly','cmp5y35wt0000vh1015ynbnq9','DELETE_JOB','Deleted job ID: cmp5yzvxl000uvhm457qjamqu',NULL,NULL,'2026-06-16 19:30:46.116'),('log-48a6vl75j','cmp5y35wt0000vh1015ynbnq9','CREATE_ADMIN','Created admin: oza',NULL,NULL,'2026-06-17 00:39:37.818'),('LOG-7TBhps7VQTOj','cmp5y35wt0000vh1015ynbnq9','DELETE_ATTACHMENT','Menghapus lampiran 1000109561.jpg','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-25 09:11:45.000'),('LOG-8gsHA4ouvhoQ',NULL,'CREATE_JOB','Membuat berkas job-gu58fulq7uyg','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-24 19:00:03.000'),('log-8i9wlz3uu','cmp5y35wt0000vh1015ynbnq9','UPDATE_JOB','Updated job ID: cmp5yzvxl000uvhm457qjamqu',NULL,NULL,'2026-06-16 06:56:43.579'),('LOG-96w6MvbeFD5i',NULL,'CREATE_JOB','Membuat berkas job-6qhpjq3ie68d','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-24 18:54:27.000'),('LOG-9cFlMI7wncW8','cmp5y35wt0000vh1015ynbnq9','ASSIGN_JOB_TASK','Menambahkan tugas pegawai pada berkas job-hd5xtvqpha6p','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-25 07:40:53.000'),('log-aleoibf10','cmp5y35wt0000vh1015ynbnq9','CREATE_STAFF','Created staff & user: pegawai satu (user-k21eijee5)',NULL,NULL,'2026-07-15 14:52:50.749'),('log-bhg1hgpfo','cmp5wpssz000avhm4h0nh6ybw','CHECK_OUT','Fachry melakukan absensi di Citra Sentul Raya, Kadumanggu, Babakan Madang, Bogor, West Java, 16810, Indonesia',NULL,NULL,'2026-06-10 12:46:05.135'),('log-cs80xjwg8','cmp5wpssz000avhm4h0nh6ybw','UPDATE_ABSENSI','Fachry melakukan absensi di Citra Sentul Raya, Kadumanggu, Babakan Madang, Bogor, West Java, 16810, Indonesia',NULL,NULL,'2026-06-10 12:46:16.397'),('LOG-d5KDNg4XBoe3','cmp5y35wt0000vh1015ynbnq9','UPDATE_JOB','Memperbarui berkas job-hicvueaudize','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-25 08:39:04.000'),('log-deg36jb45','cmp5y35wt0000vh1015ynbnq9','CREATE_JOB','Created job: PT / PMA - Pendirian (BHM-2026-0002)',NULL,NULL,'2026-06-16 07:07:22.047'),('LOG-dWYDs74Z6mt8',NULL,'ASSIGN_JOB_TASK','Menambahkan tugas pegawai pada berkas job-hd5xtvqpha6p','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-25 07:40:37.000'),('log-fvkeycrrk','cmp5y35wt0000vh1015ynbnq9','UPDATE_JOB','Updated job ID: cmp5yzvxl000uvhm457qjamqu',NULL,NULL,'2026-06-16 06:48:01.138'),('log-iz22ssx84','cmp5wpssz000avhm4h0nh6ybw','UPDATE_ABSENSI','Fachry melakukan absensi di Jalan Saman II, Gaga, Larangan, Tangerang, Banten, 15155, Indonesia',NULL,NULL,'2026-06-16 05:01:59.979'),('LOG-jr9Ds3jriiVN','cmp5y35wt0000vh1015ynbnq9','UPDATE_JOB_PROGRESS','Memperbarui progress berkas job-hd5xtvqpha6p','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-25 07:36:11.000'),('log-julygqd3x','cmp5y35wt0000vh1015ynbnq9','RESET_PASSWORD','Reset password for staff: Fachry (cmp5wpssz000avhm4h0nh6ybw)',NULL,NULL,'2026-06-16 04:08:03.270'),('LOG-k5PBAu8UFPll','cmp5y35wt0000vh1015ynbnq9','CREATE_JOB','Membuat berkas job-hd5xtvqpha6p','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-24 18:49:53.000'),('log-l2o4pjfi6','cmp5y35wt0000vh1015ynbnq9','RESET_PASSWORD','Reset password for staff: Fachry (cmp5wpssz000avhm4h0nh6ybw)',NULL,NULL,'2026-06-10 11:20:04.719'),('LOG-lfOINyEzU1iM','cmp5y35wt0000vh1015ynbnq9','UPDATE_JOB','Memperbarui berkas job-hicvueaudize','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-25 11:43:26.000'),('log-r3j5fyi7z','cmp5y35wt0000vh1015ynbnq9','UPDATE_CLIENT','Updated client: CV. Karya Mandiri 2 (cmp5vq70i0003vh7oezpxt74t)',NULL,NULL,'2026-06-10 11:12:47.606'),('LOG-rSFztHE5fnoE',NULL,'UPDATE_JOB_PROGRESS','Memperbarui progress berkas qa-job-auto-invoice-status','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-24 19:07:30.000'),('log-x9dhgmbee','cmp5wpssz000avhm4h0nh6ybw','CHECK_IN','Fachry melakukan absensi di Jalan Saman II, Gaga, Larangan, Tangerang, Banten, Java, 15155, Indonesia',NULL,NULL,'2026-06-16 04:29:00.979'),('LOG-xBA0th07v6v1','cmp5y35wt0000vh1015ynbnq9','UPDATE_JOB','Memperbarui berkas job-hicvueaudize','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-25 08:38:53.000'),('log-xc7e6toqv','cmp5y35wt0000vh1015ynbnq9','UPDATE_JOB','Updated job ID: cmp5yzvxl000uvhm457qjamqu',NULL,NULL,'2026-06-16 07:01:31.984'),('LOG-YJZGKIQeoogW','cmp5y35wt0000vh1015ynbnq9','DELETE_ATTACHMENT','Menghapus lampiran Tak Ada Rasa.jpg','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-25 09:11:52.000'),('LOG-z9payAXRAslp','cmp5y35wt0000vh1015ynbnq9','UPDATE_JOB','Memperbarui berkas job-hicvueaudize','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-25 10:30:36.000'),('log-zid1z6lg2','cmp5y35wt0000vh1015ynbnq9','CREATE_JOB','Created job: PT / PMA - Pendirian (BHM-2026-0003)',NULL,NULL,'2026-07-15 15:21:46.586'),('LOG-ZiHidrnVWcZd','cmp5y35wt0000vh1015ynbnq9','CREATE_JOB','Membuat berkas job-hicvueaudize','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-25 08:08:21.000'),('LOG-zkTPqB6rOKB3','cmp5y35wt0000vh1015ynbnq9','UPDATE_JOB','Memperbarui berkas job-hicvueaudize','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-07-25 08:40:38.000');
/*!40000 ALTER TABLE `activitylog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin` (
  `id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `role` enum('ADMINISTRATOR','PIMPINAN') NOT NULL DEFAULT 'ADMINISTRATOR',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Admin_username_key` (`username`),
  UNIQUE KEY `Admin_email_key` (`email`),
  UNIQUE KEY `Admin_phone_key` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_settings`
--

DROP TABLE IF EXISTS `app_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_settings` (
  `id` varchar(255) NOT NULL,
  `settings_key` varchar(255) NOT NULL,
  `settings_value` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key` (`settings_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_settings`
--

LOCK TABLES `app_settings` WRITE;
/*!40000 ALTER TABLE `app_settings` DISABLE KEYS */;
INSERT INTO `app_settings` VALUES ('settings-global','GLOBAL_APP_SETTINGS','{\"general\":{\"appName\":\"NOTARIS DIGITAL\",\"officeName\":\"Kantor Notaris Salfa Novia Roza, S.H.,M.Kn\",\"officeAddress\":\"Jl. KH. Ahmad Dahlan Kby. No.10 D, RT.1\\/RW.1\\nKramat Pela, Kec. Kby. Baru\\nKota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12130\",\"officeEmail\":\"info@notarisfachry.com\",\"officePhone\":\"+62 21 12345678\"},\"branding\":{\"logoUrl\":\"\\/uploads\\/WhatsApp Image 2026-06-11 at 09.39.51.jpeg\",\"faviconUrl\":null},\"finance\":{\"bankName\":\"Bank Central Asia (BCA)\",\"accountNumber\":\"1234567890\",\"accountName\":\"Salfa Novia Roza\"},\"roles\":[{\"id\":\"ADMINISTRATOR\",\"key\":\"ADMINISTRATOR\",\"name\":\"Administrator\",\"color\":\"bg-pink-500\",\"systemRole\":true,\"permissions\":{\"dashboard\":true,\"client\":true,\"berkas\":true,\"finance\":true,\"invoice\":true,\"settings\":true}},{\"id\":\"PIMPINAN\",\"key\":\"PIMPINAN\",\"name\":\"Pimpinan\",\"color\":\"bg-blue-500\",\"systemRole\":true,\"permissions\":{\"dashboard\":true,\"client\":true,\"berkas\":true,\"finance\":true,\"invoice\":true,\"settings\":true}},{\"id\":\"STAFFADMIN\",\"key\":\"STAFFADMIN\",\"name\":\"Staff Admin\",\"color\":\"bg-emerald-500\",\"systemRole\":true,\"permissions\":{\"dashboard\":true,\"client\":true,\"berkas\":true,\"finance\":false,\"invoice\":true,\"settings\":false}},{\"id\":\"OB\",\"key\":\"OB\",\"name\":\"OB \\/ Kurir\",\"color\":\"bg-slate-500\",\"systemRole\":true,\"permissions\":{\"dashboard\":true,\"client\":false,\"berkas\":true,\"finance\":false,\"invoice\":false,\"settings\":false}}],\"whatsapp\":{\"provider\":\"fonnte\",\"endpointUrl\":\"https:\\/\\/api.fonnte.com\\/send\",\"apiToken\":null,\"messages\":{\"newJob\":\"Halo {clientName}, berkas baru Anda dengan judul {jobTitle} telah dibuat dan sedang diproses oleh sistem kami.\",\"statusUpdate\":\"Halo {clientName}, status berkas {jobTitle} telah diperbarui menjadi {status}. Silakan hubungi kantor kami bila memerlukan bantuan.\",\"newInvoice\":\"Halo {clientName}, invoice baru untuk {jobTitle} telah dibuat dengan nominal {amount}. Mohon cek informasi pembayaran Anda.\"}},\"documentNumbers\":{\"quotation\":\"QUO\",\"invoice\":\"INV\",\"badan_hukum\":\"BHM\",\"non_badan_hukum\":\"NBH\",\"ppat\":\"PPAT\"}}','2026-07-23 23:04:51','2026-07-23 23:07:03');
/*!40000 ALTER TABLE `app_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachment`
--

DROP TABLE IF EXISTS `attachment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attachment` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `fileName` varchar(191) NOT NULL,
  `filePath` varchar(191) NOT NULL,
  `fileType` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `badanHukumId` varchar(191) DEFAULT NULL,
  `nonBadanHukumId` varchar(191) DEFAULT NULL,
  `ppatId` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `isPhysicalDeposited` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `Attachment_badanHukumId_fkey` (`badanHukumId`),
  KEY `Attachment_nonBadanHukumId_fkey` (`nonBadanHukumId`),
  KEY `Attachment_ppatId_fkey` (`ppatId`),
  KEY `Attachment_userId_fkey` (`userId`),
  CONSTRAINT `Attachment_badanHukumId_fkey` FOREIGN KEY (`badanHukumId`) REFERENCES `badan_hukum` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Attachment_nonBadanHukumId_fkey` FOREIGN KEY (`nonBadanHukumId`) REFERENCES `non_badan_hukum` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Attachment_ppatId_fkey` FOREIGN KEY (`ppatId`) REFERENCES `ppat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Attachment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachment`
--

LOCK TABLES `attachment` WRITE;
/*!40000 ALTER TABLE `attachment` DISABLE KEYS */;
INSERT INTO `attachment` VALUES ('ATT-3xqjutfhs','cmp5wpssz000avhm4h0nh6ybw','KTP','/uploads/Undangan_rapat_Eksnternal No. 26 05072026.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','2026-07-15 15:21:46.569','job-1en1a9v7m',NULL,NULL,'KTP',0),('ATT-6g190c769','cmp5wpssz000avhm4h0nh6ybw','NPWP','/uploads/1000914759.jpg','image/jpeg','2026-07-15 15:21:46.569','job-1en1a9v7m',NULL,NULL,'NPWP',0),('ATT-a69A04nPnT16','cmp5y35wt0000vh1015ynbnq9','1000109561.jpg','/uploads/attachments/NAYCBFctzdLAxHMDMyRgp1QMNKOu87chcwxApKk4.jpg','image/jpeg','2026-07-25 11:43:26.000','job-hicvueaudize',NULL,NULL,'NPWP — dddddd',0),('ATT-aMGrNasPVGkU','cmp5y35wt0000vh1015ynbnq9','Emak-Emak Makhluk Terkuat di Bumi.jpg','/uploads/attachments/3D3M4tOn3wicwyELdW9uo89417taM871DBN7aYjP.jpg','image/jpeg','2026-07-24 18:49:53.000','job-hd5xtvqpha6p',NULL,NULL,'KTP — KTP DIREKTUR',0),('ATT-BbusfA2ovnvG','cmp5y35wt0000vh1015ynbnq9','1000109561.jpg','/uploads/attachments/AzIUP73ad922EP6eehM6EfxjqiciMMrNjyu8Pziq.jpg','image/jpeg','2026-07-25 11:43:26.000','job-hicvueaudize',NULL,NULL,'Surat Kuasa — dddddd',0),('ATT-hft689cir','cmp5wpssz000avhm4h0nh6ybw','sdf','/uploads/51bb320e-6272-4392-893e-ffe65f584f1b.jpeg','image/jpeg','2026-06-16 07:07:22.033','job-1nfyk7yyo',NULL,NULL,'sdf',0),('ATT-rsrrPTwGXjx1','cmp5y35wt0000vh1015ynbnq9','1000109561.jpg','/uploads/attachments/SuWO0w814uxwMsFfSxs4rKZL21EgxufmIdLFYBq6.jpg','image/jpeg','2026-07-24 18:49:53.000','job-hd5xtvqpha6p',NULL,NULL,'Kartu Keluarga — KK',0),('ATT-sglaQx0gZINW','cmp5y35wt0000vh1015ynbnq9','Tak Ada Rasa.jpg','/uploads/attachments/pr35PLePfQ6vj8X39vXpZuORXs6xkv7FIdBo6DUN.jpg','image/jpeg','2026-07-25 11:43:26.000','job-hicvueaudize',NULL,NULL,'Kartu Keluarga — ddd',0);
/*!40000 ALTER TABLE `attachment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attendance` (
  `id` varchar(255) NOT NULL,
  `staffId` varchar(255) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `checkIn` datetime DEFAULT NULL,
  `checkOut` datetime DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Hadir',
  `notes` text DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `attendance_staffId_fkey` (`staffId`),
  KEY `attendance_date_idx` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES ('attendance-1hWu7BOZyfP2','staff-wjr2tpjgp','2026-11-18 15:12:39','2026-11-18 15:12:39',NULL,'Hadir','{\"checkIn\":{\"workLocationType\":\"Office\",\"locationLabel\":\"RW 13, Grogol Selatan, Kebayoran Lama, Jakarta Selatan, Daerah Khusus Ibukota Jakarta, 12220, Indonesia\",\"latitude\":\"-6.230551\",\"longitude\":\"106.771539\",\"submittedAt\":\"2026-11-18T08:12:39+00:00\",\"photoPath\":\"\\/uploads\\/attendance\\/ST2yTCHbuVeiOZuBNJyuJnXx70LUHy5WcG65ubXR.jpg\"}}','2026-11-18 15:12:39','2026-11-18 15:12:39');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `badan_hukum`
--

DROP TABLE IF EXISTS `badan_hukum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `badan_hukum` (
  `id` varchar(191) NOT NULL,
  `trackingCode` varchar(191) NOT NULL,
  `clientId` varchar(191) NOT NULL,
  `staffId` varchar(191) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `pengurusanUntuk` varchar(255) DEFAULT NULL,
  `companyName` varchar(191) DEFAULT NULL,
  `status` enum('PENDING','PROSES','REVISI','REVISI_PROSES','VERIFIKASI','SELESAI','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  `deadline` datetime(3) DEFAULT NULL,
  `saksi` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `invoiceStatus` enum('PENDING','DP','PAYMENT','LUNAS') NOT NULL DEFAULT 'PENDING',
  `sourceInvoiceId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `badan_hukum_trackingCode_key` (`trackingCode`),
  KEY `badan_hukum_clientId_fkey` (`clientId`),
  KEY `badan_hukum_staffId_fkey` (`staffId`),
  KEY `badan_hukum_sourceinvoiceid_index` (`sourceInvoiceId`),
  CONSTRAINT `badan_hukum_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `badan_hukum_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `badan_hukum`
--

LOCK TABLES `badan_hukum` WRITE;
/*!40000 ALTER TABLE `badan_hukum` DISABLE KEYS */;
INSERT INTO `badan_hukum` VALUES ('job-1en1a9v7m','BHM-2026-0003','cmp5vq70i0003vh7oezpxt74t','cmp5wpssz000avhm4h0nh6ybw','PT / PMA - Pendirian','PT / PMA','Pendirian','PT TEs Saja','SELESAI','MEDIUM','2026-07-29 08:21:45.949','pegawai satu',NULL,'2026-07-15 15:21:46.564','2026-07-24 18:57:41.000','PENDING',NULL),('job-1nfyk7yyo','BHM-2026-0002','cmp5vq70i0003vh7oezpxt74t','cmp5wpssz000avhm4h0nh6ybw','PT / PMA - Pendirian','PT / PMA','Pendirian','MAJU MAPAN','PENDING','MEDIUM','2026-06-30 00:07:21.921','Fachry','dsfdsf','2026-06-16 07:07:22.024','2026-07-24 18:57:55.000','PENDING',NULL),('job-hd5xtvqpha6p','BHM/24072026/0004','client-gfzvgisgatuk','cmp5y35wt0000vh1015ynbnq9','PT / PMA - Pendirian','PT / PMA','Pendirian','PT TES AJA YA','PROSES','MEDIUM','2026-08-07 00:00:00.000','Fachry','awewae','2026-07-24 18:49:53.000','2026-07-25 07:36:11.000','DP','inv-5c9rLqHXkD7u'),('job-hicvueaudize','BHM/25072026/0007','client-gfzvgisgatuk','cmp5y35wt0000vh1015ynbnq9','CV - Perubahan','CV','Perubahan','asdsad','PENDING','MEDIUM','2026-08-08 00:00:00.000',NULL,NULL,'2026-07-25 08:08:21.000','2026-09-02 21:04:17.000','PENDING',NULL);
/*!40000 ALTER TABLE `badan_hukum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `client`
--

DROP TABLE IF EXISTS `client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `client` (
  `id` varchar(191) NOT NULL,
  `indexNo` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `province` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `district` varchar(191) DEFAULT NULL,
  `village` varchar(191) DEFAULT NULL,
  `type` varchar(191) DEFAULT 'individual',
  `gender` varchar(191) DEFAULT NULL,
  `citizenship` varchar(191) DEFAULT NULL,
  `picName` varchar(191) DEFAULT NULL,
  `npwp` varchar(191) DEFAULT NULL,
  `birthday` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_indexNo_key` (`indexNo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client`
--

LOCK TABLES `client` WRITE;
/*!40000 ALTER TABLE `client` DISABLE KEYS */;
INSERT INTO `client` VALUES ('client-gfzvgisgatuk',3,'asdsa','asad@test.com','081313132204','sadasdsa sd asd asd','ID','DKI JAKARTA','KOTA JAKARTA SELATAN','KEBAYORAN LAMA','KEBAYORAN LAMA UTARA','individual','Laki-laki','WNI',NULL,NULL,'2026-07-21 00:00:00.000','2026-07-24 16:30:24.000','2026-07-24 18:48:40.000'),('cmp5vpkb40000vh7obs9ox4nq',1,'Fachry Hidayat','fachryhidayat@gmail.com','6281313132204','Jl Panjang Cidodol','ID','SUMATERA BARAT','KABUPATEN SOLOK','LEMBAH GUMANTI','SUNGAI NANAM','individual','Laki-laki','WNI',NULL,NULL,'1988-05-14 00:00:00.000','2026-05-14 19:26:00.208','2026-05-14 19:26:00.208'),('cmp5vq70i0003vh7oezpxt74t',2,'CV. Karya Mandiri 2','fachryhidaywwat@gmail.com','6281313132205','qweqwe','ID','BANTEN','KOTA CILEGON','GROGOL','KOTASARI','corporate','Laki-laki','WNI','wqewqe',NULL,'2026-05-14 00:00:00.000','2026-05-14 19:26:29.634','2026-06-10 11:12:47.000');
/*!40000 ALTER TABLE `client` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense`
--

DROP TABLE IF EXISTS `expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `expense` (
  `id` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `expenseDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense`
--

LOCK TABLES `expense` WRITE;
/*!40000 ALTER TABLE `expense` DISABLE KEYS */;
/*!40000 ALTER TABLE `expense` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financerecord`
--

DROP TABLE IF EXISTS `financerecord`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `financerecord` (
  `id` varchar(191) NOT NULL,
  `badanHukumId` varchar(191) DEFAULT NULL,
  `nonBadanHukumId` varchar(191) DEFAULT NULL,
  `ppatId` varchar(191) DEFAULT NULL,
  `invoiceId` varchar(191) DEFAULT NULL,
  `type` enum('INCOME','EXPENSE') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `FinanceRecord_badanHukumId_fkey` (`badanHukumId`),
  KEY `FinanceRecord_nonBadanHukumId_fkey` (`nonBadanHukumId`),
  KEY `FinanceRecord_ppatId_fkey` (`ppatId`),
  KEY `financerecord_invoiceId_fkey` (`invoiceId`),
  CONSTRAINT `FinanceRecord_badanHukumId_fkey` FOREIGN KEY (`badanHukumId`) REFERENCES `badan_hukum` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FinanceRecord_nonBadanHukumId_fkey` FOREIGN KEY (`nonBadanHukumId`) REFERENCES `non_badan_hukum` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FinanceRecord_ppatId_fkey` FOREIGN KEY (`ppatId`) REFERENCES `ppat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `financerecord_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financerecord`
--

LOCK TABLES `financerecord` WRITE;
/*!40000 ALTER TABLE `financerecord` DISABLE KEYS */;
INSERT INTO `financerecord` VALUES ('FIN-PRGO1Q4',NULL,NULL,NULL,NULL,'INCOME',1000000.00,'sdasd','2026-05-27 00:00:00.000','2026-05-27 16:52:23.119'),('FIN-Yb9KTtcA1M',NULL,NULL,NULL,'inv-5c9rLqHXkD7u','INCOME',1000000.00,'Pembayaran DP','2026-07-24 00:00:00.000','2026-07-24 12:01:23.000');
/*!40000 ALTER TABLE `financerecord` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `founder`
--

DROP TABLE IF EXISTS `founder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `founder` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `position` varchar(255) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `badanHukumId` varchar(191) DEFAULT NULL,
  `nonBadanHukumId` varchar(191) DEFAULT NULL,
  `ppatId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Founder_badanHukumId_fkey` (`badanHukumId`),
  KEY `Founder_nonBadanHukumId_fkey` (`nonBadanHukumId`),
  KEY `Founder_ppatId_fkey` (`ppatId`),
  CONSTRAINT `Founder_badanHukumId_fkey` FOREIGN KEY (`badanHukumId`) REFERENCES `badan_hukum` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Founder_nonBadanHukumId_fkey` FOREIGN KEY (`nonBadanHukumId`) REFERENCES `non_badan_hukum` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Founder_ppatId_fkey` FOREIGN KEY (`ppatId`) REFERENCES `ppat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `founder`
--

LOCK TABLES `founder` WRITE;
/*!40000 ALTER TABLE `founder` DISABLE KEYS */;
INSERT INTO `founder` VALUES ('FND-0uz3c6lro','Bapak B',NULL,'34234324','shdshd@tes.com','2026-07-15 15:21:46.567','job-1en1a9v7m',NULL,NULL),('FND-4MynNZbuifHs','waewa',NULL,'081313132204','fachryhidayat@gmail.com','2026-07-24 18:49:53.000','job-hd5xtvqpha6p',NULL,NULL),('FND-9es4hzc76','Bapak A',NULL,'2839182938','sagdhsag@test.com','2026-07-15 15:21:46.567','job-1en1a9v7m',NULL,NULL),('FND-rf98zzoi3','sadasd',NULL,'324','fachryhidayat@gmail.com','2026-06-16 07:07:22.028','job-1nfyk7yyo',NULL,NULL),('FND-wfq5JMsm7iX1','asd','sad',NULL,NULL,'2026-09-02 21:04:17.000','job-hicvueaudize',NULL,NULL);
/*!40000 ALTER TABLE `founder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice`
--

DROP TABLE IF EXISTS `invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoice` (
  `id` varchar(191) NOT NULL,
  `invoiceNumber` varchar(191) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Belum Bayar',
  `description` text DEFAULT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  `date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `badanHukumId` varchar(191) DEFAULT NULL,
  `nonBadanHukumId` varchar(191) DEFAULT NULL,
  `ppatId` varchar(191) DEFAULT NULL,
  `quotationId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_invoiceNumber_key` (`invoiceNumber`),
  UNIQUE KEY `invoice_quotationid_unique` (`quotationId`),
  KEY `invoice_badanHukumId_fkey` (`badanHukumId`),
  KEY `invoice_nonBadanHukumId_fkey` (`nonBadanHukumId`),
  KEY `invoice_ppatId_fkey` (`ppatId`),
  CONSTRAINT `invoice_badanHukumId_fkey` FOREIGN KEY (`badanHukumId`) REFERENCES `badan_hukum` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoice_nonBadanHukumId_fkey` FOREIGN KEY (`nonBadanHukumId`) REFERENCES `non_badan_hukum` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoice_ppatId_fkey` FOREIGN KEY (`ppatId`) REFERENCES `ppat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice`
--

LOCK TABLES `invoice` WRITE;
/*!40000 ALTER TABLE `invoice` DISABLE KEYS */;
INSERT INTO `invoice` VALUES ('inv-5c9rLqHXkD7u','INV/24072026/0004',5500000.00,'DP Bayar',NULL,'2026-08-06 00:00:00.000','2026-07-24 00:00:00.000','2026-07-24 12:01:23.000','2026-07-25 07:18:38.000','job-hd5xtvqpha6p',NULL,NULL,'quo-ynl2avimty0vbcsp');
/*!40000 ALTER TABLE `invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_item`
--

DROP TABLE IF EXISTS `invoice_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoice_item` (
  `id` varchar(191) NOT NULL,
  `invoiceId` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT 1.00,
  `unit` varchar(50) NOT NULL DEFAULT 'item',
  `unitPrice` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sortOrder` int(10) unsigned NOT NULL DEFAULT 0,
  `createdAt` datetime(3) DEFAULT NULL,
  `updatedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_item_invoiceid_sortorder_index` (`invoiceId`,`sortOrder`),
  CONSTRAINT `invoice_item_invoiceid_foreign` FOREIGN KEY (`invoiceId`) REFERENCES `invoice` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_item`
--

LOCK TABLES `invoice_item` WRITE;
/*!40000 ALTER TABLE `invoice_item` DISABLE KEYS */;
INSERT INTO `invoice_item` VALUES ('invi-DNpW8965d86n','inv-5c9rLqHXkD7u','Jasa',1.00,'item',5000000.00,5000000.00,0,'2026-07-24 12:01:23.000','2026-07-24 12:01:23.000'),('invi-j1Dw51kZYlfw','inv-5c9rLqHXkD7u','NIB',1.00,'item',500000.00,500000.00,1,'2026-07-24 12:01:23.000','2026-07-24 12:01:23.000');
/*!40000 ALTER TABLE `invoice_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_employee_task`
--

DROP TABLE IF EXISTS `job_employee_task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_employee_task` (
  `id` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `taskType` varchar(255) NOT NULL,
  `customTask` varchar(255) DEFAULT NULL,
  `fee` decimal(15,2) NOT NULL DEFAULT 0.00,
  `isPaid` tinyint(1) NOT NULL DEFAULT 0,
  `paidAt` datetime DEFAULT NULL,
  `badanHukumId` varchar(255) DEFAULT NULL,
  `nonBadanHukumId` varchar(255) DEFAULT NULL,
  `ppatId` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `job_employee_task_user_type_index` (`userId`,`taskType`),
  KEY `job_employee_task_userid_index` (`userId`),
  KEY `job_employee_task_badanhukumid_index` (`badanHukumId`),
  KEY `job_employee_task_nonbadanhukumid_index` (`nonBadanHukumId`),
  KEY `job_employee_task_ppatid_index` (`ppatId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_employee_task`
--

LOCK TABLES `job_employee_task` WRITE;
/*!40000 ALTER TABLE `job_employee_task` DISABLE KEYS */;
INSERT INTO `job_employee_task` VALUES ('JET-2zmnFNDfHArR','cmp5y35wt0000vh1015ynbnq9','Saksi',NULL,0.00,0,NULL,'job-hicvueaudize',NULL,NULL,'2026-09-02 21:04:17','2026-09-02 21:04:17'),('JET-AfUSdtfCijXL','cmp5y35wt0000vh1015ynbnq9','PIC',NULL,0.00,0,NULL,'job-hicvueaudize',NULL,NULL,'2026-09-02 21:04:17','2026-09-02 21:04:17'),('JET-cFD6oxKf0ldB','cmp5wpssz000avhm4h0nh6ybw','PBB',NULL,5000.00,0,NULL,'job-hicvueaudize',NULL,NULL,'2026-09-02 21:04:17','2026-09-02 21:12:38'),('JET-lZl4GmYdtkbb','cmp5y35wt0000vh1015ynbnq9','Lainnya','BUAT KOPI',0.00,0,NULL,'job-hicvueaudize',NULL,NULL,'2026-09-02 21:04:17','2026-09-02 21:04:17'),('JET-PIC-3f4xgxfbae','cmp5wpssz000avhm4h0nh6ybw','PIC',NULL,0.00,0,NULL,'job-1nfyk7yyo',NULL,NULL,'2026-07-25 08:16:00','2026-07-25 08:16:00'),('JET-PIC-7olbfkvykn','cmp5y35wt0000vh1015ynbnq9','PIC',NULL,0.00,0,NULL,'job-hd5xtvqpha6p',NULL,NULL,'2026-07-25 08:16:00','2026-09-02 21:12:03'),('JET-PIC-saa3dg0igl','cmp5wpssz000avhm4h0nh6ybw','PIC',NULL,0.00,0,NULL,'job-1en1a9v7m',NULL,NULL,'2026-07-25 08:16:00','2026-07-25 08:16:00'),('JET-SQQtnSziK6lz','cmp5y35wt0000vh1015ynbnq9','NIB',NULL,50000.00,0,NULL,'job-hicvueaudize',NULL,NULL,'2026-09-02 21:04:17','2026-09-02 21:12:33'),('JET-T7vc7LZMT7Ft','user-k21eijee5','NIB',NULL,0.00,0,NULL,'job-hd5xtvqpha6p',NULL,NULL,'2026-07-25 07:40:53','2026-07-25 07:40:53'),('JET-yQQ2EkPCdGUJ','cmp5y35wt0000vh1015ynbnq9','Saksi',NULL,0.00,0,NULL,'job-hd5xtvqpha6p',NULL,NULL,'2026-07-25 07:40:53','2026-07-25 07:40:53');
/*!40000 ALTER TABLE `job_employee_task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobprogress`
--

DROP TABLE IF EXISTS `jobprogress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobprogress` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `statusBefore` enum('PENDING','PROSES','REVISI','REVISI_PROSES','VERIFIKASI','SELESAI','CANCELLED') NOT NULL,
  `statusAfter` enum('PENDING','PROSES','REVISI','REVISI_PROSES','VERIFIKASI','SELESAI','CANCELLED') NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `badanHukumId` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `nonBadanHukumId` varchar(191) DEFAULT NULL,
  `ppatId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `JobProgress_badanHukumId_fkey` (`badanHukumId`),
  KEY `JobProgress_nonBadanHukumId_fkey` (`nonBadanHukumId`),
  KEY `JobProgress_ppatId_fkey` (`ppatId`),
  KEY `JobProgress_userId_fkey` (`userId`),
  CONSTRAINT `JobProgress_badanHukumId_fkey` FOREIGN KEY (`badanHukumId`) REFERENCES `badan_hukum` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `JobProgress_nonBadanHukumId_fkey` FOREIGN KEY (`nonBadanHukumId`) REFERENCES `non_badan_hukum` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `JobProgress_ppatId_fkey` FOREIGN KEY (`ppatId`) REFERENCES `ppat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `JobProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobprogress`
--

LOCK TABLES `jobprogress` WRITE;
/*!40000 ALTER TABLE `jobprogress` DISABLE KEYS */;
INSERT INTO `jobprogress` VALUES ('PROG-FZOabvy9CVJs','cmp5y35wt0000vh1015ynbnq9','PENDING','PENDING','2026-07-25 08:08:21.000','job-hicvueaudize','Berkas didaftarkan (Perubahan)',NULL,NULL),('PROG-mi1ar5jcNO3t','cmp5y35wt0000vh1015ynbnq9','PENDING','PENDING','2026-07-25 11:43:26.000','job-hicvueaudize','Informasi berkas diperbarui',NULL,NULL),('PROG-mriSzhMr65T5','cmp5y35wt0000vh1015ynbnq9','PENDING','PENDING','2026-07-25 10:30:36.000','job-hicvueaudize','Informasi berkas diperbarui',NULL,NULL),('PROG-nDn5q5fKpX1Y','cmp5y35wt0000vh1015ynbnq9','PENDING','PROSES','2026-07-25 07:36:11.000','job-hd5xtvqpha6p','Progress berkas diperbarui',NULL,NULL),('PROG-owALAY8t7rPb','cmp5y35wt0000vh1015ynbnq9','PENDING','PENDING','2026-09-02 21:04:17.000','job-hicvueaudize','Informasi berkas diperbarui',NULL,NULL),('PROG-yAhzvXYEX3VY','cmp5y35wt0000vh1015ynbnq9','PENDING','SELESAI','2026-07-23 22:42:26.000','job-1en1a9v7m','Progress berkas diperbarui',NULL,NULL);
/*!40000 ALTER TABLE `jobprogress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2026_07_20_000001_create_quotation_tables',1),(2,'2026_07_24_000001_make_quotation_client_manual',2),(3,'2026_07_24_000002_create_quotation_publications_table',3),(4,'2026_07_24_000003_link_invoice_to_quotation',4),(5,'2026_07_24_000004_add_cancellation_details_to_quotation',5),(6,'2026_07_24_000005_create_invoice_items_table',6),(7,'2026_07_24_000006_add_invoice_created_quotation_status',7),(8,'2026_07_25_000001_add_position_to_founder',8),(9,'2026_07_25_000003_add_source_invoice_to_jobs',9),(10,'2026_07_25_000004_add_management_for_to_jobs',10),(11,'2026_07_25_000005_create_job_employee_tasks_table',11),(12,'2026_07_25_000006_backfill_job_pic_tasks',12),(13,'2026_07_25_000007_add_fee_to_job_employee_task_table',13),(14,'2026_07_25_000008_add_is_paid_to_job_employee_task_table',14),(15,'2026_11_18_000001_add_is_physical_deposited_to_attachment_table',15),(16,'2026_11_18_000002_convert_attendance_times_to_local_timezone',16);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `non_badan_hukum`
--

DROP TABLE IF EXISTS `non_badan_hukum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `non_badan_hukum` (
  `id` varchar(191) NOT NULL,
  `trackingCode` varchar(191) NOT NULL,
  `clientId` varchar(191) NOT NULL,
  `staffId` varchar(191) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `pengurusanUntuk` varchar(255) DEFAULT NULL,
  `companyName` varchar(191) DEFAULT NULL,
  `status` enum('PENDING','PROSES','REVISI','REVISI_PROSES','VERIFIKASI','SELESAI','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  `deadline` datetime(3) DEFAULT NULL,
  `saksi` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `invoiceStatus` enum('PENDING','DP','PAYMENT','LUNAS') NOT NULL DEFAULT 'PENDING',
  `sourceInvoiceId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `non_badan_hukum_trackingCode_key` (`trackingCode`),
  KEY `non_badan_hukum_clientId_fkey` (`clientId`),
  KEY `non_badan_hukum_staffId_fkey` (`staffId`),
  KEY `non_badan_hukum_sourceinvoiceid_index` (`sourceInvoiceId`),
  CONSTRAINT `non_badan_hukum_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `non_badan_hukum_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `non_badan_hukum`
--

LOCK TABLES `non_badan_hukum` WRITE;
/*!40000 ALTER TABLE `non_badan_hukum` DISABLE KEYS */;
/*!40000 ALTER TABLE `non_badan_hukum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'INFO',
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `Notification_userId_fkey` (`userId`),
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ppat`
--

DROP TABLE IF EXISTS `ppat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ppat` (
  `id` varchar(191) NOT NULL,
  `trackingCode` varchar(191) NOT NULL,
  `clientId` varchar(191) NOT NULL,
  `staffId` varchar(191) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `pengurusanUntuk` varchar(255) DEFAULT NULL,
  `companyName` varchar(191) DEFAULT NULL,
  `status` enum('PENDING','PROSES','REVISI','REVISI_PROSES','VERIFIKASI','SELESAI','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  `deadline` datetime(3) DEFAULT NULL,
  `saksi` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `invoiceStatus` enum('PENDING','DP','PAYMENT','LUNAS') NOT NULL DEFAULT 'PENDING',
  `sourceInvoiceId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ppat_trackingCode_key` (`trackingCode`),
  KEY `ppat_clientId_fkey` (`clientId`),
  KEY `ppat_staffId_fkey` (`staffId`),
  KEY `ppat_sourceinvoiceid_index` (`sourceInvoiceId`),
  CONSTRAINT `ppat_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `ppat_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ppat`
--

LOCK TABLES `ppat` WRITE;
/*!40000 ALTER TABLE `ppat` DISABLE KEYS */;
/*!40000 ALTER TABLE `ppat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotation`
--

DROP TABLE IF EXISTS `quotation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quotation` (
  `id` varchar(191) NOT NULL,
  `quotationNumber` varchar(191) NOT NULL,
  `clientId` varchar(191) DEFAULT NULL,
  `clientName` varchar(191) DEFAULT NULL,
  `clientPhone` varchar(191) DEFAULT NULL,
  `clientEmail` varchar(191) DEFAULT NULL,
  `clientAddress` text DEFAULT NULL,
  `picUserId` varchar(191) NOT NULL,
  `subject` varchar(191) NOT NULL,
  `quotationDate` date NOT NULL,
  `validUntil` date DEFAULT NULL,
  `status` enum('Draft','Dikirim','Disetujui','Ditolak','Kedaluwarsa','Dibatalkan','Invoice Terbuat') NOT NULL DEFAULT 'Draft',
  `subtotal` decimal(18,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `taxPercent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `taxAmount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `grandTotal` decimal(18,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `cancellationReason` text DEFAULT NULL,
  `cancelledAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `quotation_quotationnumber_unique` (`quotationNumber`),
  KEY `quotation_clientid_index` (`clientId`),
  KEY `quotation_picuserid_index` (`picUserId`),
  KEY `quotation_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation`
--

LOCK TABLES `quotation` WRITE;
/*!40000 ALTER TABLE `quotation` DISABLE KEYS */;
INSERT INTO `quotation` VALUES ('quo-5xsgddvf7vsmbmmq','QUO/23072026/0002',NULL,'wqw','081313132204','wq@mail.com','Jl Panjang Cidodol\nGg Ikhlas RT 005/013 No 21','cmp5y35wt0000vh1015ynbnq9','Pembuatan PT Baryu','2026-07-23','2026-08-06','Draft',6000000.00,0.00,0.00,0.00,6000000.00,NULL,'Harga berlaku sampai tanggal yang tercantum. Pembayaran dilakukan sesuai kesepakatan.',NULL,NULL,'2026-07-23 23:12:19.000','2026-07-23 23:12:19.000'),('quo-6mqjqjcf4s64qlgr','QUO/24072026/0003',NULL,'TEs Client BAru','080808','test@gmail.com','Jakarta Selatan','cmp5wpssz000avhm4h0nh6ybw','Penawaran Pembuatan PT ABCDE','2026-07-24','2026-08-10','Dibatalkan',4600000.00,0.00,0.00,0.00,4600000.00,NULL,'Harga berlaku sampai tanggal yang tercantum. Pembayaran dilakukan sesuai kesepakatan.',NULL,NULL,'2026-07-24 05:10:55.000','2026-07-24 09:50:15.000'),('quo-ebyw2zyuwuymmnyb','QUO/12112026/0004','cmp5vq70i0003vh7oezpxt74t','CV. Karya Mandiri 2','6281313132205','fachryhidaywwat@gmail.com','qweqwe','cmp5wpssz000avhm4h0nh6ybw','Pembutan pt','2026-11-12','2026-11-26','Dikirim',6000000.00,0.00,0.00,0.00,6000000.00,NULL,'Harga berlaku sampai tanggal yang tercantum. Pembayaran dilakukan sesuai kesepakatan.',NULL,NULL,'2026-11-12 14:56:18.000','2026-11-12 14:56:29.000'),('quo-ynl2avimty0vbcsp','QUO-2026-0001','client-gfzvgisgatuk','asdsa',NULL,'asad@test.com','sadasdsa sd asd asd','cmp5y35wt0000vh1015ynbnq9','Penawaran Pembuatan PT ABC','2026-07-23','2026-08-06','Invoice Terbuat',5500000.00,0.00,0.00,0.00,5500000.00,NULL,'Harga berlaku sampai tanggal yang tercantum. Pembayaran dilakukan sesuai kesepakatan.',NULL,NULL,'2026-07-23 22:50:11.000','2026-07-24 16:30:24.000');
/*!40000 ALTER TABLE `quotation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotation_item`
--

DROP TABLE IF EXISTS `quotation_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quotation_item` (
  `id` varchar(191) NOT NULL,
  `quotationId` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT 1.00,
  `unit` varchar(50) NOT NULL DEFAULT 'item',
  `unitPrice` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `sortOrder` int(10) unsigned NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `quotation_item_quotationid_index` (`quotationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_item`
--

LOCK TABLES `quotation_item` WRITE;
/*!40000 ALTER TABLE `quotation_item` DISABLE KEYS */;
INSERT INTO `quotation_item` VALUES ('qitem-5gypt82h3wbaueh4','quo-ynl2avimty0vbcsp','NIB',1.00,'item',500000.00,500000.00,1,'2026-07-23 22:50:11.000','2026-07-23 22:50:11.000'),('qitem-cdg4glf9hvr7wof2','quo-ynl2avimty0vbcsp','Jasa',1.00,'item',5000000.00,5000000.00,0,'2026-07-23 22:50:11.000','2026-07-23 22:50:11.000'),('qitem-ibar2beayzeuidre','quo-6mqjqjcf4s64qlgr','Pembuatan NPWP',1.00,'item',200000.00,200000.00,1,'2026-07-24 05:10:55.000','2026-07-24 05:10:55.000'),('qitem-jtplylhqxwmoazcl','quo-ebyw2zyuwuymmnyb','jhjhgh',1.00,'item',6000000.00,6000000.00,0,'2026-11-12 14:56:18.000','2026-11-12 14:56:18.000'),('qitem-kxlzmrkceesjknwm','quo-6mqjqjcf4s64qlgr','Jasa Notaris',1.00,'item',4000000.00,4000000.00,0,'2026-07-24 05:10:55.000','2026-07-24 05:10:55.000'),('qitem-mhevm9pyj46aqwky','quo-6mqjqjcf4s64qlgr','Pembuatan NIB',1.00,'item',400000.00,400000.00,2,'2026-07-24 05:10:55.000','2026-07-24 05:10:55.000'),('qitem-yuyfbpjgvagskk6a','quo-5xsgddvf7vsmbmmq','sas',1.00,'item',6000000.00,6000000.00,0,'2026-07-23 23:12:19.000','2026-07-23 23:12:19.000');
/*!40000 ALTER TABLE `quotation_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotation_publications`
--

DROP TABLE IF EXISTS `quotation_publications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quotation_publications` (
  `id` varchar(255) NOT NULL,
  `quotationId` varchar(255) NOT NULL,
  `emailSentAt` datetime DEFAULT NULL,
  `whatsappSentAt` datetime DEFAULT NULL,
  `publishedAt` datetime DEFAULT NULL,
  `processingAt` datetime DEFAULT NULL,
  `lastError` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quotation_publications_quotationid_unique` (`quotationId`),
  CONSTRAINT `quotation_publications_quotationid_foreign` FOREIGN KEY (`quotationId`) REFERENCES `quotation` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_publications`
--

LOCK TABLES `quotation_publications` WRITE;
/*!40000 ALTER TABLE `quotation_publications` DISABLE KEYS */;
INSERT INTO `quotation_publications` VALUES ('qpub-jqfmjtimjtxxkvrx','quo-ebyw2zyuwuymmnyb',NULL,NULL,'2026-11-12 14:56:29',NULL,NULL,'2026-11-12 14:56:29','2026-11-12 14:56:29'),('qpub-pgcwaddxwxizqklr','quo-ynl2avimty0vbcsp',NULL,NULL,'2026-07-24 09:51:17',NULL,NULL,'2026-07-24 09:51:17','2026-07-24 09:51:17'),('qpub-rasjtcr4osgmxx4r','quo-6mqjqjcf4s64qlgr',NULL,NULL,'2026-07-24 09:33:50',NULL,NULL,'2026-07-24 09:33:50','2026-07-24 09:33:50');
/*!40000 ALTER TABLE `quotation_publications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reminder`
--

DROP TABLE IF EXISTS `reminder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reminder` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `remindAt` datetime(3) NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `Reminder_userId_fkey` (`userId`),
  CONSTRAINT `Reminder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminder`
--

LOCK TABLES `reminder` WRITE;
/*!40000 ALTER TABLE `reminder` DISABLE KEYS */;
/*!40000 ALTER TABLE `reminder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sequence`
--

DROP TABLE IF EXISTS `sequence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sequence` (
  `id` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `year` int(11) NOT NULL,
  `lastNum` int(11) NOT NULL DEFAULT 0,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Sequence_category_year_key` (`category`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequence`
--

LOCK TABLES `sequence` WRITE;
/*!40000 ALTER TABLE `sequence` DISABLE KEYS */;
INSERT INTO `sequence` VALUES ('seq-88ico6l8e','INVOICE',2026,4,'2026-07-24 12:01:23.000'),('seq-ejprziyarsq3','QUOTATION',2026,4,'2026-11-12 14:56:18.000'),('seq-m4198vki1','Badan Hukum/Usaha',2026,7,'2026-07-25 08:08:21.000');
/*!40000 ALTER TABLE `sequence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `staff` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `ktpPath` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `photoPath` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_userId_key` (`userId`),
  CONSTRAINT `staff_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES ('cmp5wpst5000cvhm4npwzdacp','cmp5wpssz000avhm4h0nh6ybw','/uploads/staff/ktp_cmp5wpssz000avhm4h0nh6ybw_1778788450836.jpeg','2026-05-14 19:54:10.841','2026-05-14 19:54:10.841','/uploads/staff/photo_cmp5wpssz000avhm4h0nh6ybw_1778788450839.jpeg'),('staff-2vhcqn8vbxoa','user-g1bkmwcaut7c',NULL,'2026-11-18 07:24:47.000','2026-11-18 07:24:47.000',NULL),('staff-wjr2tpjgp','user-k21eijee5',NULL,'2026-07-15 14:52:50.740','0000-00-00 00:00:00.000',NULL);
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `username` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `fullName` varchar(191) NOT NULL,
  `role` enum('ADMINISTRATOR','PIMPINAN','STAFFADMIN','OB') NOT NULL DEFAULT 'STAFFADMIN',
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `birthday` datetime(3) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_username_key` (`username`),
  UNIQUE KEY `User_email_key` (`email`),
  UNIQUE KEY `User_phone_key` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('cmp5wpssz000avhm4h0nh6ybw','fachry','fachryhidayat@gmail.com','$2y$12$iWRAGgtXmPhhylCv59r7L.qwrVOTDsk3zZahxm0Nd6tKVLil3tt2K','Fachry','STAFFADMIN',1,'2026-05-14 19:54:10.835','2026-09-02 21:14:22.000','1988-05-15 00:00:00.000',NULL),('cmp5y35wt0000vh1015ynbnq9','admin','admin@notaris.com','$2y$12$f7S9sghWruxm762PA1ldSOIH6cVIoTqAraOlkVbh14MAIDIRlPWj2','Administrator','ADMINISTRATOR',1,'2026-05-14 20:32:33.966','2026-07-18 11:43:18.000',NULL,NULL),('user-g1bkmwcaut7c','pimpinan','tes@mail.com','$2y$12$A1kuKGvZQGMe/Ed7NWijpeqlIPewhOV5hdoetTnjLSIJGeAOFN8lG','oza','PIMPINAN',1,'2026-11-18 07:24:47.000','2026-11-18 07:24:47.000',NULL,'081313132222'),('user-k21eijee5','pegawai1','pegawai1@tes.mail','$2y$12$ygH4q7.asYigxTn2hVy7l.BFLrFq3RrjNIcunAr.LzQ9.nTR2KIMi','pegawai satu','STAFFADMIN',1,'2026-07-15 14:52:50.737','2026-11-18 07:34:53.000','2026-07-16 00:00:00.000','2312412341234');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'notaris'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-19  9:42:40
