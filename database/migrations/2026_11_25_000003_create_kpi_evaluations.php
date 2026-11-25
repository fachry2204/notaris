<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void { Schema::create('kpi_evaluations', function(Blueprint $t) { $t->bigIncrements('id'); $t->string('user_id'); $t->date('period_start'); $t->date('period_end'); $t->text('notes')->nullable(); $t->text('improvement_plan')->nullable(); $t->text('next_target')->nullable(); $t->string('updated_by'); $t->timestamps(); $t->unique(['user_id','period_start','period_end']); }); }
 public function down(): void { Schema::dropIfExists('kpi_evaluations'); }
};
